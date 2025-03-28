// Firebase database structure
{
  "videos": {
    "[videoId]": {  // e.g., "2023_cw003"
      "name": "2023 cw003",
      "activity": "Jumping jacks",
      "type": "cardio",
      "bodyPart": "Sistema cardiovascular",
      "description": "Sistema cardiovascular, Cuerpo completo",
      "thumbnailUrl": "https://sagafit.virtuagym.com/thumb/activity/picture/36676b8a645de0b2a6fda70bb03d463ab797.png",
      "thumbnailId": "3076772393",
      "path": "10011090/día 1/2023_cw003.mp4",
      "plan_url": "https://sagafit.virtuagym.com/user/anassharboulica-3a9f3e2f/exercise/workout-player?plan_id=9829516&day_id=18220897",
      "plan_id": "9829516",
      "day_id": "18220897",
      "day_name": "día 1",
      "thumbnailPath": "videofitness\\9829516\\día 1\\images",
      "videoPath": "videofitness\\9829516\\día 1"
    }
  },
  "plans": {
    "[plan_id]": {
      "name": "Plan Name",
      "days": {
        "[day_id]": {
          "name": "día 1",
          "videos": {
            "[videoId]": true  // References to videos in this day
          }
        }
      }
    }
  }
} 