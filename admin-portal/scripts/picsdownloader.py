import csv
import logging
import requests
import time
import random
from pathlib import Path
import os

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def download_image(image_url, output_path, max_retries=3):
    """Télécharge une image avec gestion des erreurs."""
    for attempt in range(max_retries):
        try:
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            return True
            
        except Exception as e:
            if attempt < max_retries - 1:
                logging.warning(f"Tentative {attempt + 1} échouée pour {image_url}: {e}")
                time.sleep(random.uniform(2, 4))
            else:
                logging.error(f"Échec du téléchargement après {max_retries} tentatives: {image_url}")
                return False

def process_images():
    """Traite et télécharge les images pour chaque vidéo."""
    try:
        # Lecture du fichier video_details.csv
        with open("video_details.csv", 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            videos = list(reader)
        
        total_images = len(videos)
        processed_images = 0
        
        # Parcourir chaque vidéo
        for video in videos:
            try:
                plan_id = video['plan_id']
                day_name = video['day_name']
                video_id = video['videoId'].replace('_text', '')  # Nettoyer l'ID
                image_url = video['videoImg']
                
                # Construire le chemin du dossier
                base_path = Path("downloaded_videos")
                plan_dir = base_path / str(plan_id)
                day_dir = plan_dir / day_name
                images_dir = day_dir / "images"
                
                # Créer le dossier images s'il n'existe pas
                images_dir.mkdir(exist_ok=True, parents=True)
                
                # Définir le nom du fichier image
                image_extension = image_url.split('.')[-1]
                image_filename = f"{video_id}.{image_extension}"
                image_path = images_dir / image_filename
                
                # Télécharger l'image si elle n'existe pas
                if not image_path.exists():
                    logging.info(f"\nTéléchargement de l'image pour la vidéo {video_id}")
                    success = download_image(image_url, image_path)
                    
                    if success:
                        logging.info(f"Image téléchargée: {image_filename}")
                    
                    # Pause aléatoire entre les téléchargements
                    time.sleep(random.uniform(0.5, 1.5))
                else:
                    logging.info(f"Image déjà existante: {image_filename}")
                
                processed_images += 1
                progress = (processed_images / total_images) * 100
                logging.info(f"Progression globale: {progress:.1f}% ({processed_images}/{total_images})")
                
            except Exception as e:
                logging.error(f"Erreur lors du traitement de l'image {video.get('videoId', 'unknown')}: {e}")
                continue
        
        logging.info(f"Téléchargement des images terminé. Total traité: {processed_images}/{total_images}")
        
    except Exception as e:
        logging.error(f"Erreur principale: {e}")
        raise

def main():
    try:
        process_images()
    except Exception as e:
        logging.error(f"Erreur dans le programme principal: {e}")

if __name__ == "__main__":
    main()