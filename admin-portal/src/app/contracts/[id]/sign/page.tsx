'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-hot-toast';
import { Contract } from '@/types/contract';
import { use } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function ContractSigningPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signing, setSigning] = useState<boolean>(false);
  const [signed, setSigned] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  const router = useRouter();
  

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/contracts/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch contract');
        }
        
        const contractData = await response.json();
        setContract(contractData);
      } catch (error) {
        console.error('Error fetching contract:', error);
        setError('Failed to load contract details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContract();
  }, [id]);
    
  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Please provide a signature before submitting');
      return;
    }
    
    setSigning(true);
    try {
      const signatureData = signatureRef.current.toDataURL();
      
      // Use the API endpoint for signing
      const response = await fetch(`/api/contracts/${id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature: signatureData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Contract signing failed with status:', response.status);
        console.error('Error details:', errorData);
        throw new Error(errorData.error || 'Failed to sign contract');
      }
      
      const result = await response.json();
      toast.success('Contract signed successfully!');
      setSigned(true);
      
      // Optional: Redirect to a confirmation page or show the signed PDF
      if (result.signedPdfUrl) {
        window.open(result.signedPdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Contract signing error:', error);
      toast.error(`Failed to sign contract: ${error instanceof Error ? error.message : String(error)}`);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setSigning(false);
    }
  };

  const handleDone = () => {
    // Just close the window or go to a general page
    window.close(); // This will attempt to close the window
    // Fallback if close doesn't work
    window.location.href = 'https://fitsaga.com'; // Or any appropriate public URL
  };
  
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };
  // At the end of your component, before the final return statement, add:
  if (signed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckIcon className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-green-600">Contract Signed Successfully!</h1>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Thank you for signing the contract. A copy of the signed document has been sent to your email.
            </p>
            <p className="text-gray-700 mb-4 font-semibold">
              Please check your Gmail inbox for an email from FitSAGA containing your signed contract.
            </p>
            <p className="text-gray-700 mb-4">
              You can access the signed document and all other details through the FitSAGA mobile app.
            </p>
          </div>
          
          <button
            onClick={handleDone}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }
  
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

