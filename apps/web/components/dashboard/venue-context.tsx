'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export interface VenueInfo {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
}

interface VenueContextValue {
  venues: VenueInfo[];
  current: VenueInfo | null;
  switchVenue: (id: string) => void;
  removeVenue: (id: string) => void;
  addVenue: (venue: VenueInfo) => void;
  updateVenue: (id: string, updates: Partial<VenueInfo>) => void;
}

const VenueContext = createContext<VenueContextValue>({
  venues: [],
  current: null,
  switchVenue: () => {},
  removeVenue: () => {},
  addVenue: () => {},
  updateVenue: () => {},
});

export function VenueProvider({
  venues: initialVenues,
  children,
}: {
  venues: VenueInfo[];
  children: React.ReactNode;
}) {
  const [venues, setVenues] = useState(initialVenues);
  const [currentId, setCurrentId] = useState(initialVenues[0]?.id ?? null);

  const current = venues.find((v) => v.id === currentId) ?? venues[0] ?? null;

  const switchVenue = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const removeVenue = useCallback((id: string) => {
    setVenues((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      if (currentId === id) {
        setCurrentId(updated[0]?.id ?? null);
      }
      return updated;
    });
  }, [currentId]);

  const addVenue = useCallback((venue: VenueInfo) => {
    setVenues((prev) => [...prev, venue]);
    setCurrentId(venue.id);
  }, []);

  const updateVenue = useCallback((id: string, updates: Partial<VenueInfo>) => {
    setVenues((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  }, []);

  return (
    <VenueContext.Provider value={{ venues, current, switchVenue, removeVenue, addVenue, updateVenue }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  return useContext(VenueContext);
}
