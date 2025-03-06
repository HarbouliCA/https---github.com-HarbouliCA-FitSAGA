import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, Firestore } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!firestore) {
    return res.status(500).json({ error: 'Firestore is not initialized' });
  }

  if (req.method === 'POST') {
    try {
      const sessionData = req.body;
      const docRef = await addDoc(collection(firestore as Firestore, 'sessions'), sessionData);
      res.status(200).json({ id: docRef.id, ...sessionData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create session' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}