import React from 'react'

export default function ClassPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Class Form
        </h1>
        <p className="text-sm text-slate-500">Academic &gt; Class details</p>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
        Class form content will appear here.
      </div>
    </div>
  )
}
