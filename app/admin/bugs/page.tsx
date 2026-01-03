
import React from 'react';
import { getAllBugReportsAction } from '@/lib/actions';
import { AdminBugList } from '@/components/AdminBugList';
import { redirect } from 'next/navigation';

export default async function AdminBugsPage() {
  let reports;
  try {
    reports = await getAllBugReportsAction();
  } catch (error) {
    // If unauthorized or error, redirect or show error
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-white p-8">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Bug Reports Dashboard</h1>
            <AdminBugList initialReports={reports} />
        </div>
    </div>
  );
}
