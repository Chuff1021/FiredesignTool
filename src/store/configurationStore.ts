"use client";

import { create } from "zustand";
import {
  DEFAULT_CONFIGURATION,
  normalizeConfiguration,
  type CameraMode,
  type FeatureWallConfiguration,
} from "@/domain/configuration";
import {
  clearPersistedConfiguration,
  readPersistedConfiguration,
  writePersistedConfiguration,
} from "@/lib/persistence";

type ConfigurationState = FeatureWallConfiguration & {
  initialized: boolean;
  recoveredMessage: string | null;
  initialize: () => void;
  setWallWidth: (value: number) => void;
  setWallHeight: (value: number) => void;
  setFireplaceElevation: (value: number) => void;
  setMantelClearance: (value: number) => void;
  setCameraMode: (value: CameraMode) => void;
  setShowDimensions: (value: boolean) => void;
  reset: () => void;
};

function pickConfiguration(state: ConfigurationState): FeatureWallConfiguration {
  return {
    schemaVersion: 1,
    wallWidth: state.wallWidth,
    wallHeight: state.wallHeight,
    fireplaceElevation: state.fireplaceElevation,
    mantelClearance: state.mantelClearance,
    cameraMode: state.cameraMode,
    showDimensions: state.showDimensions,
  };
}

function saveNext(state: ConfigurationState, patch: Partial<FeatureWallConfiguration>) {
  const configuration = normalizeConfiguration({ ...pickConfiguration(state), ...patch });
  writePersistedConfiguration(window.localStorage, configuration);
  return configuration;
}

export const useConfigurationStore = create<ConfigurationState>((set) => ({
  ...DEFAULT_CONFIGURATION,
  initialized: false,
  recoveredMessage: null,
  initialize: () => {
    const result = readPersistedConfiguration(window.localStorage);
    set({
      ...result.configuration,
      initialized: true,
      recoveredMessage: result.reason ?? null,
    });
  },
  setWallWidth: (value) => set((state) => saveNext(state, { wallWidth: value })),
  setWallHeight: (value) => set((state) => saveNext(state, { wallHeight: value })),
  setFireplaceElevation: (value) =>
    set((state) => saveNext(state, { fireplaceElevation: value })),
  setMantelClearance: (value) => set((state) => saveNext(state, { mantelClearance: value })),
  setCameraMode: (value) => set((state) => saveNext(state, { cameraMode: value })),
  setShowDimensions: (value) => set((state) => saveNext(state, { showDimensions: value })),
  reset: () => {
    clearPersistedConfiguration(window.localStorage);
    set({ ...DEFAULT_CONFIGURATION, recoveredMessage: null });
  },
}));
