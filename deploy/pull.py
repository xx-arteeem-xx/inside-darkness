"""Install the verified public release and switch the Nginx document root."""
from hashlib import sha256
import json
import os
from pathlib import Path
import re
from shutil import rmtree
import tarfile
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen


REPOSITORY = 'xx-arteeem-xx/inside-darkness'
SITE_VERSION = 'https://inside-darkness.ru/version.json'
ARCHIVE = 'inside-darkness.tar.gz'
RELEASE_SIZE = 48 * 1024**2
UNPACKED_SIZE = 96 * 1024**2
STATE = Path('/var/lib/inside-darkness')
REVISION = re.compile(r'[a-f0-9]{40}')


def download(url, limit):
    request = Request(url, headers={'User-Agent': 'inside-darkness-projects'})
    with urlopen(request, timeout=25) as response:
        content = response.read(limit + 1)
    if len(content) > limit:
        raise ValueError(f'Response exceeds the size limit: {url}')
    return content


def validate_site(directory, revision):
    version = json.loads((directory / 'version.json').read_text())
    if version['revision'] != revision:
        raise ValueError('Archive revision does not match the release tag')
    for path in ('index.html', 'map/index.html', 'guide/search.json', 'rp/inside-darkness-rp.zip'):
        if not (directory / path).is_file():
            raise ValueError(f'Archive is missing {path}')


def update():
    release = json.loads(download(f'https://api.github.com/repos/{REPOSITORY}/releases/latest', 1024**2))
    tag = release['tag_name']
    revision = tag.removeprefix('projects-')
    if not tag.startswith('projects-') or not REVISION.fullmatch(revision):
        raise ValueError(f'Unexpected release tag {tag}')

    versions = STATE / 'releases'
    versions.mkdir(exist_ok=True)
    target = versions / revision
    current = STATE / 'current'
    previous_link = os.readlink(current) if current.is_symlink() else None
    if previous_link == str(target.relative_to(STATE)):
        return

    asset = next(item for item in release['assets'] if item['name'] == ARCHIVE)
    digest = asset['digest']
    if not isinstance(digest, str) or not re.fullmatch(r'sha256:[a-f0-9]{64}', digest):
        raise ValueError('Release has no valid asset digest')

    with TemporaryDirectory(dir=STATE) as temporary:
        work = Path(temporary)
        if not target.is_dir():
            content = download(f'https://github.com/{REPOSITORY}/releases/download/{tag}/{ARCHIVE}', RELEASE_SIZE)
            if f'sha256:{sha256(content).hexdigest()}' != digest:
                raise ValueError('Release digest mismatch')

            archive = work / ARCHIVE
            archive.write_bytes(content)
            unpack = work / 'site'
            unpack.mkdir()
            with tarfile.open(archive) as bundle:
                members = bundle.getmembers()
                if any(not (member.isfile() or member.isdir()) for member in members):
                    raise ValueError('The archive contains unsupported file types')
                if sum(member.size for member in members) > UNPACKED_SIZE:
                    raise ValueError('Unpacked release exceeds the size limit')
                bundle.extractall(unpack, members=members, filter='data')
            validate_site(unpack, revision)
            unpack.rename(target)

        validate_site(target, revision)
        link = work / 'current'
        link.symlink_to(target.relative_to(STATE))
        os.replace(link, current)

        if previous_link is not None:
            try:
                served = json.loads(download(SITE_VERSION, 1024**2))
                if served['revision'] != revision:
                    raise ValueError('HTTPS returned a different revision')
            except Exception:
                link.symlink_to(previous_link)
                os.replace(link, current)
                print(f'Restored {previous_link} after an unsuccessful update', flush=True)
                raise

    previous = sorted(
        (item for item in versions.iterdir() if item.is_dir() and item != target and REVISION.fullmatch(item.name)),
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    )
    for expired in previous[2:]:
        rmtree(expired)
    print(f'Published landing {revision}', flush=True)


if __name__ == '__main__':
    update()
