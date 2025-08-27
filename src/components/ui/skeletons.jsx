/**
 * Composants Skeleton centralisés pour éviter la duplication
 */

import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * Skeleton pour carte de statistiques
 */
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton pour carte de commande
 */
export function OrderCardSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton pour carte de service
 */
export function ServiceCardSkeleton() {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-16 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <Skeleton className="h-8 w-32 mx-auto mb-1" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton pour en-tête de page
 */
export function HeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2 bg-white/20" />
              <Skeleton className="h-4 w-32 bg-white/20" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-24 mb-1 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton pour liste de données
 */
export function DataListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton pour tableau
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {/* En-tête */}
      <div className="grid gap-4 p-4 bg-gray-50 border-b" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Lignes */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 p-4 border-b" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton pour formulaire
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * Skeleton générique pour contenu de page
 */
export function PageContentSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* En-tête */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}

export default {
  StatsCardSkeleton,
  OrderCardSkeleton,
  ServiceCardSkeleton,
  HeaderSkeleton,
  DataListSkeleton,
  TableSkeleton,
  FormSkeleton,
  PageContentSkeleton
}
