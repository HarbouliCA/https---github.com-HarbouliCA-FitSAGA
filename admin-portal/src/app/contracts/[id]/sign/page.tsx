'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-hot-toast';
import { Contract } from '@/types/contract';

export default function ContractSigningPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    async function fetchContract() {
      try {
        // Use the API endpoint instead of direct data access
        const response = await fetch(`/api/contracts/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch contract');
        
        const contractData = await response.json();
        if (!contractData) throw new Error('Contract not found');
        setContract(contractData);
      } catch (error) {
        console.error('Error fetching contract:', error);
        toast.error('Failed to load contract');
      } finally {
        setLoading(false);
      }
    }
    
    fetchContract();
  }, [params.id]);
  
  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }
    
    if (!contract) {
      toast.error('Contract not found');
      return;
    }
    
    setSigning(true);
    try {
      const signatureData = signatureRef.current.toDataURL();
      
      // Use the API endpoint for signing
      const response = await fetch(`/api/contracts/${params.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature: signatureData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign contract');
      }
      
      toast.success('Contract signed successfully!');
      router.push('/dashboard/clients');
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error('Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };
  
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Contract Not Found</h1>
        <p className="text-gray-600 mb-8">The contract you're looking for doesn't exist or has been removed.</p>
        <Link href="/dashboard/clients" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Return to Clients
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6">FitSAGA Membership Contract</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Contract Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Client Name</p>
              <p className="font-medium">{contract.clientName}</p>
            </div>
            <div>
              <p className="text-gray-600">Client Email</p>
              <p className="font-medium">{contract.clientEmail}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium capitalize">{contract.status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-600">Created Date</p>
              <p className="font-medium">
                {new Date(contract.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Contract Document</h2>
          <div className="border border-gray-300 rounded p-4 mb-4">
            <iframe 
              src={contract.pdfUrl} 
              className="w-full h-96 border-0" 
              title="Contract Document"
            />
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Signature</h2>
          <p className="text-gray-600 mb-4">
            Please sign below to indicate that you have read and agree to the terms of the contract.
          </p>
          <div className="border border-gray-300 rounded p-2 mb-4">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-40 bg-white',
              }}
            />
          </div>
          <button
            type="button"
            onClick={clearSignature}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded mr-4 hover:bg-gray-300"
          >
            Clear Signature
          </button>
        </div>
        
        <div className="flex justify-between">
          <Link
            href="/dashboard/clients"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSign}
            disabled={signing}
            className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${
              signing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {signing ? 'Signing...' : 'Sign Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}
