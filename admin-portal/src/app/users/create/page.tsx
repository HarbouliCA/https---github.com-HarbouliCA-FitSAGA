'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createUserWithEmailAndPassword, Auth } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type FormInputs = {
  name: string;
  email: string;
  password: string;
  sex: 'male' | 'female' | 'other';
  birthday: string;
  height: number;
  weight: number;
  observations: string;
  fidelityScore: number;
  credits: number;
};

export default function CreateUserPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      sex: 'male',
      fidelityScore: 0,
      credits: 0,
    }
  });
  
  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      if (!auth || !firestore) {
        throw new Error('Firebase services not initialized');
      }
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth as Auth,
        data.email,
        data.password
      );
      
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const now = new Date();
      const birthday = data.birthday ? new Date(data.birthday) : undefined;
      
      await setDoc(doc(firestore as Firestore, 'users', user.uid), {
        uid: user.uid,
        email: data.email,
        name: data.name,
        sex: data.sex,
        height: Number(data.height),
        weight: Number(data.weight),
        birthday,
        observations: data.observations,
        fidelityScore: Number(data.fidelityScore),
        credits: Number(data.credits),
        role: 'user',
        memberSince: serverTimestamp(),
        lastActive: serverTimestamp(),
        onboardingCompleted: true,
        accessStatus: 'green'
      });
      
      router.push('/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users" className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="page-title">Create New User</h1>
      </div>
      
      <div className="card max-w-3xl">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="sex" className="form-label">Sex</label>
              <select
                id="sex"
                className="input-field"
                {...register('sex')}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="birthday" className="form-label">Birthday</label>
              <input
                id="birthday"
                type="date"
                className="input-field"
                {...register('birthday')}
              />
            </div>
            
            <div>
              <label htmlFor="height" className="form-label">Height (cm)</label>
              <input
                id="height"
                type="number"
                className="input-field"
                {...register('height', { 
                  valueAsNumber: true,
                  min: {
                    value: 50,
                    message: 'Height must be at least 50cm'
                  },
                  max: {
                    value: 250,
                    message: 'Height must be less than 250cm'
                  }
                })}
              />
              {errors.height && (
                <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="weight" className="form-label">Weight (kg)</label>
              <input
                id="weight"
                type="number"
                className="input-field"
                {...register('weight', { 
                  valueAsNumber: true,
                  min: {
                    value: 20,
                    message: 'Weight must be at least 20kg'
                  },
                  max: {
                    value: 300,
                    message: 'Weight must be less than 300kg'
                  }
                })}
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="credits" className="form-label">Credits</label>
              <input
                id="credits"
                type="number"
                className="input-field"
                {...register('credits', { 
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: 'Credits cannot be negative'
                  }
                })}
              />
              {errors.credits && (
                <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="fidelityScore" className="form-label">Fidelity Score</label>
              <input
                id="fidelityScore"
                type="number"
                className="input-field"
                {...register('fidelityScore', { 
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: 'Fidelity score cannot be negative'
                  },
                  max: {
                    value: 100,
                    message: 'Fidelity score must be less than 100'
                  }
                })}
              />
              {errors.fidelityScore && (
                <p className="mt-1 text-sm text-red-600">{errors.fidelityScore.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="observations" className="form-label">Observations</label>
            <textarea
              id="observations"
              rows={4}
              className="input-field"
              {...register('observations')}
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link href="/users" className="btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
