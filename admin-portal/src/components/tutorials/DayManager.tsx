'use client';

import { useState } from 'react';
import { Day, Exercise } from '@/interfaces/tutorial';
import ExerciseConfig from './ExerciseConfig';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';

interface DayManagerProps {
  day: Day;
  onUpdate: (updatedDay: Day) => void;
}

export default function DayManager({ day, onUpdate }: DayManagerProps) {
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [dayTitle, setDayTitle] = useState(day.title);
  const [dayDescription, setDayDescription] = useState(day.description);

  // Function to convert Azure thumbnail URLs to our proxy URLs
  const getThumbnailProxyUrl = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return '';
    
    try {
      // Extract the base path without the SAS token
      const [basePath] = thumbnailUrl.split('?');
      
      // First decode the URL in case it's already encoded
      const decodedPath = decodeURIComponent(basePath);
      
      // Try to extract the path after the container name
      const blobMatch = decodedPath.match(/\/\/[^\/]+\.blob\.core\.windows\.net\/[^\/]+\/(.+)$/);
      if (blobMatch) {
        const exactPath = blobMatch[1];
        return `/api/image-proxy?path=${encodeURIComponent(exactPath)}`;
      }
      
      // For other URLs, use the previous approach
      const containerMatch = decodedPath.match(/(?:sagathumbnails\/|images\/|thumbnails\/)(.+)$/i);
      if (!containerMatch) {
        // If no container pattern found, use the full path
        return `/api/image-proxy?path=${encodeURIComponent(decodedPath)}`;
      }
      
      const path = containerMatch[1];
      
      // Return the proxy URL with the encoded path
      return `/api/image-proxy?path=${encodeURIComponent(path)}`;
    } catch (error) {
      console.error('Error processing thumbnail URL:', error);
      return '';
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const updatedDay = {
      ...day,
      exercises: [...day.exercises, exercise]
    };
    onUpdate(updatedDay);
    setIsAddingExercise(false);
  };

  const handleUpdateExercise = (exercise: Exercise, index: number) => {
    const updatedExercises = [...day.exercises];
    updatedExercises[index] = exercise;
    
    const updatedDay = {
      ...day,
      exercises: updatedExercises
    };
    
    onUpdate(updatedDay);
    setEditingExerciseIndex(null);
  };

  const handleRemoveExercise = (index: number) => {
    // Use window.confirm to ensure the confirm dialog works properly
    if (window.confirm('Are you sure you want to remove this exercise?')) {
      const updatedExercises = day.exercises.filter((_, i) => i !== index);
      
      const updatedDay = {
        ...day,
        exercises: updatedExercises
      };
      
      onUpdate(updatedDay);
    }
  };

  const handleDayInfoUpdate = () => {
    const updatedDay = {
      ...day,
      title: dayTitle,
      description: dayDescription
    };
    
    onUpdate(updatedDay);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(day.exercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedDay = {
      ...day,
      exercises: items
    };
    
    onUpdate(updatedDay);
  };

  // If we're adding or editing an exercise, show the exercise config component
  if (isAddingExercise) {
    return (
      <ExerciseConfig
        onSave={handleAddExercise}
        onCancel={() => setIsAddingExercise(false)}
      />
    );
  }

  if (editingExerciseIndex !== null) {
    return (
      <ExerciseConfig
        exercise={day.exercises[editingExerciseIndex]}
        onSave={(exercise) => handleUpdateExercise(exercise, editingExerciseIndex)}
        onCancel={() => setEditingExerciseIndex(null)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Day {day.dayNumber}: {day.title}</h2>
      
      {/* Day Information */}
      <div className="mb-6 space-y-4 border-b pb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Day Title
          </label>
          <input
            type="text"
            value={dayTitle}
            onChange={(e) => setDayTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="e.g., Upper Body Workout"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={dayDescription}
            onChange={(e) => setDayDescription(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Describe this day's workout..."
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleDayInfoUpdate}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Update Day Info
          </button>
        </div>
      </div>
      
      {/* Exercises List */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Exercises ({day.exercises.length})</h3>
          <button
            onClick={() => setIsAddingExercise(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Add Exercise
          </button>
        </div>
        
        {day.exercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            No exercises added yet. Click "Add Exercise" to get started.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable 
              droppableId="exercises" 
              isDropDisabled={false}
              isCombineEnabled={false}
              ignoreContainerClipping={false}
            >
              {(provided: DroppableProvided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {day.exercises.map((exercise, index) => (
                    <Draggable key={index} draggableId={`exercise-${index}`} index={index}>
                      {(provided: DraggableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="font-medium">{index + 1}.</div>
                              {exercise.thumbnailUrl && (
                                <div className="w-12 h-12 relative bg-gray-200 rounded">
                                  <img
                                    src={getThumbnailProxyUrl(exercise.thumbnailUrl)}
                                    alt={exercise.name}
                                    className="object-cover w-full h-full rounded"
                                  />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{exercise.name}</div>
                                <div className="text-sm text-gray-500">
                                  {exercise.sets} sets × {exercise.repetitions} reps
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingExerciseIndex(index)}
                                className="p-1 text-blue-500 hover:text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveExercise(index)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
} 