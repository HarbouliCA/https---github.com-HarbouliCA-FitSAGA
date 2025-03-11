'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { getContract } from '@/lib/dataAccess/contracts';
import { Contract } from '@/types/contract';

export default function ContractConfirmationPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchContract() {
      try {
        const contractData = await getContract(params.id);
        if (!contractData) throw new Error('Contract not found');
        setContract(contractData);
      } catch (error) {
        console.error('Error fetching contract:', error);
        toast.error('Failed to load contract information');
      } finally {
        setLoading(false);
      }
    }
    
    fetchContract();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contract Not Found</h1>
          <p className="text-gray-600 mb-6">The contract you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Signed Successfully!</h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for signing your FitSAGA membership contract. A copy of the signed contract has been sent to your email address.
        </p>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Contract Details</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><span className="font-medium">Client:</span> {contract.clientName}</li>
            <li><span className="font-medium">Email:</span> {contract.clientEmail}</li>
            <li>
              <span className="font-medium">Date Signed:</span> {
                contract.signedAt 
                  ? new Date(contract.signedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
              }
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <a 
            href={contract.signedPdfUrl || contract.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full"
          >
            View Signed Contract
          </a>
          
          <Link href="/" className="btn-secondary w-full block">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
