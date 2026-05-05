from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
import mimetypes
import mutagen
import shutil

mimetypes.add_type('audio/flac', '.flac')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "audio_files")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
IMAGES_DIR = os.path.join(DATA_DIR, "images")
DB_FILE = os.path.join(DATA_DIR, "db.json")

# Ensure directories exist
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(FRONTEND_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# Mount frontend directory for static files (js, css)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
app.mount("/api/images", StaticFiles(directory=IMAGES_DIR), name="images")

def load_db():
    if not os.path.exists(DB_FILE):
        return {"playlists": {}, "tags": {}, "albums": {}}
    with open(DB_FILE, "r") as f:
        data = json.load(f)
        if "albums" not in data:
            data["albums"] = {}
        return data

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=4)

def extract_metadata(file_path):
    filename = os.path.basename(file_path)
    title = os.path.splitext(filename)[0]
    artist = "Unknown Artist"
    album = "Unknown Album"
    
    try:
        audio = mutagen.File(file_path, easy=True)
        if audio:
            if 'title' in audio and audio['title']:
                title = audio['title'][0]
            if 'artist' in audio and audio['artist']:
                artist = audio['artist'][0]
            if 'album' in audio and audio['album']:
                album = audio['album'][0]
    except Exception:
        pass
        
    return {"filename": filename, "title": title, "artist": artist, "album": album}

@app.get("/", response_class=HTMLResponse)
async def read_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            return f.read()
    return "<h1>Frontend not found</h1>"

@app.get("/api/tracks")
async def get_tracks():
    db = load_db()
    tracks = []
    if os.path.exists(AUDIO_DIR):
        for filename in os.listdir(AUDIO_DIR):
            file_path = os.path.join(AUDIO_DIR, filename)
            if os.path.isfile(file_path):
                metadata = extract_metadata(file_path)
                metadata["tags"] = db.get("tags", {}).get(filename, [])
                tracks.append(metadata)
    return tracks

class PlaylistData(BaseModel):
    name: str
    tracks: List[str]

class TagData(BaseModel):
    filename: str
    tag: str

@app.get("/api/playlists")
async def get_playlists():
    db = load_db()
    playlists = db.get("playlists", {})
    # Migrate old lists to dicts
    for k, v in playlists.items():
        if isinstance(v, list):
            playlists[k] = {"tracks": v, "image": None, "description": "", "tags": []}
        else:
            if "description" not in playlists[k]: playlists[k]["description"] = ""
            if "tags" not in playlists[k]: playlists[k]["tags"] = []
    return playlists

@app.post("/api/playlists")
async def save_playlist(playlist: PlaylistData):
    db = load_db()
    if "playlists" not in db: db["playlists"] = {}
    existing = db["playlists"].get(playlist.name, {"tracks": [], "image": None})
    if isinstance(existing, list): existing = {"tracks": existing, "image": None}
    
    existing["tracks"] = playlist.tracks
    db["playlists"][playlist.name] = existing
    save_db(db)
    return {"status": "success"}

@app.post("/api/playlists/upload")
async def create_playlist_upload(
    name: str = Form(...), 
    image: UploadFile = File(None),
    description: str = Form(""),
    tags: str = Form("")
):
    db = load_db()
    if "playlists" not in db: db["playlists"] = {}
    
    image_filename = None
    if image and image.filename:
        # Sanitize filename
        safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        image_filename = f"{safe_name}_{image.filename}"
        image_path = os.path.join(IMAGES_DIR, image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
    existing = db["playlists"].get(name, {"tracks": [], "image": None, "description": "", "tags": []})
    if isinstance(existing, list):
        existing = {"tracks": existing, "image": None, "description": "", "tags": []}
        
    if image_filename:
        existing["image"] = image_filename
        
    existing["description"] = description
    existing["tags"] = [t.strip().lower() for t in tags.split(",") if t.strip()]
        
    db["playlists"][name] = existing
    save_db(db)
    return {"status": "success"}

@app.delete("/api/playlists/{name}")
async def delete_playlist(name: str):
    db = load_db()
    if "playlists" in db and name in db["playlists"]:
        del db["playlists"][name]
        save_db(db)
    return {"status": "success"}

@app.get("/api/albums")
async def get_albums():
    db = load_db()
    albums = db.get("albums", {})
    # Ensure all albums have tracks array
    for k, v in albums.items():
        if "tracks" not in v:
            v["tracks"] = []
        if "description" not in v:
            v["description"] = ""
        if "tags" not in v:
            v["tags"] = []
    return albums

class AlbumTrackData(BaseModel):
    name: str
    tracks: List[str]

@app.post("/api/albums")
async def save_album_tracks(album: AlbumTrackData):
    db = load_db()
    if "albums" not in db:
        db["albums"] = {}
    existing = db["albums"].get(album.name, {"tracks": [], "image": None, "description": "", "tags": []})
    existing["tracks"] = album.tracks
    db["albums"][album.name] = existing
    save_db(db)
    return {"status": "success"}

@app.post("/api/albums/upload")
async def save_album_meta(
    name: str = Form(...),
    image: UploadFile = File(None),
    description: str = Form(""),
    tags: str = Form("")
):
    db = load_db()
    if "albums" not in db:
        db["albums"] = {}

    image_filename = None
    if image and image.filename:
        safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c == ' ']).rstrip()
        image_filename = f"album_{safe_name}_{image.filename}"
        image_path = os.path.join(IMAGES_DIR, image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    existing = db["albums"].get(name, {"tracks": [], "image": None, "description": "", "tags": []})

    if image_filename:
        existing["image"] = image_filename

    existing["description"] = description
    existing["tags"] = [t.strip().lower() for t in tags.split(",") if t.strip()]

    db["albums"][name] = existing
    save_db(db)
    return {"status": "success"}

@app.post("/api/tags")
async def add_tag(tag_data: TagData):
    db = load_db()
    if "tags" not in db: db["tags"] = {}
    if tag_data.filename not in db["tags"]:
        db["tags"][tag_data.filename] = []
    
    if tag_data.tag not in db["tags"][tag_data.filename]:
        db["tags"][tag_data.filename].append(tag_data.tag)
        save_db(db)
    return {"status": "success"}

class RemoveTagData(BaseModel):
    filename: str
    tag: str

@app.post("/api/tags/remove")
async def remove_tag(tag_data: RemoveTagData):
    db = load_db()
    if "tags" in db and tag_data.filename in db["tags"]:
        if tag_data.tag in db["tags"][tag_data.filename]:
            db["tags"][tag_data.filename].remove(tag_data.tag)
            save_db(db)
    return {"status": "success"}

@app.get("/api/stream/{filename}")
async def stream_audio(request: Request, filename: str):
    file_path = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("Range")
    
    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": mimetypes.guess_type(file_path)[0] or "audio/mpeg",
    }
    
    if range_header:
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
        
        headers["Content-Length"] = str(end - start + 1)
        headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        
        def file_iterator():
            with open(file_path, "rb") as file:
                file.seek(start)
                bytes_to_read = end - start + 1
                while bytes_to_read > 0:
                    chunk = file.read(min(65536, bytes_to_read))
                    if not chunk:
                        break
                    bytes_to_read -= len(chunk)
                    yield chunk
                    
        return StreamingResponse(file_iterator(), headers=headers, status_code=206)
    
    return FileResponse(file_path, headers=headers)
