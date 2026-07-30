"use client";

import { create } from "zustand";
import type {
  FaceOptionId,
  FireplaceId,
  MantelFinishId,
  MantelProductId,
  MantelWidth,
  StoneId,
} from "@/domain/catalog";
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
  setStoneWidth: (value: number) => void;
  setFireplaceElevation: (value: number) => void;
  setMantelHeightAboveBase: (value: number) => void;
  setFireplaceId: (value: FireplaceId) => void;
  setFaceOptionId: (value: FaceOptionId) => void;
  setStoneId: (value: StoneId) => void;
  setMantelProductId: (value: MantelProductId) => void;
  setMantelWidth: (value: MantelWidth) => void;
  setMantelFinishId: (value: MantelFinishId) => void;
  setHearthEnabled: (value: boolean) => void;
  setHearthStoneCount: (value: 3 | 4 | 5) => void;
  setCameraMode: (value: CameraMode) => void;
  setShowDimensions: (value: boolean) => void;
  reset: () => void;
};

function pickConfiguration(state: ConfigurationState): FeatureWallConfiguration {
  return {
    schemaVersion: 3,
    wallWidth: state.wallWidth,
    wallHeight: state.wallHeight,
    stoneWidth: state.stoneWidth,
    fireplaceElevation: state.fireplaceElevation,
    mantelHeightAboveBase: state.mantelHeightAboveBase,
    fireplaceId: state.fireplaceId,
    faceOptionId: state.faceOptionId,
    stoneId: state.stoneId,
    mantelProductId: state.mantelProductId,
    mantelWidth: state.mantelWidth,
    mantelFinishId: state.mantelFinishId,
    hearthEnabled: state.hearthEnabled,
    hearthStoneCount: state.hearthStoneCount,
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
  setStoneWidth: (value) => set((state) => saveNext(state, { stoneWidth: value })),
  setFireplaceElevation: (value) =>
    set((state) => saveNext(state, { fireplaceElevation: value })),
  setMantelHeightAboveBase: (value) =>
    set((state) => saveNext(state, { mantelHeightAboveBase: value })),
  setFireplaceId: (value) => set((state) => saveNext(state, { fireplaceId: value })),
  setFaceOptionId: (value) => set((state) => saveNext(state, { faceOptionId: value })),
  setStoneId: (value) => set((state) => saveNext(state, { stoneId: value })),
  setMantelProductId: (value) => set((state) => saveNext(state, { mantelProductId: value })),
  setMantelWidth: (value) => set((state) => saveNext(state, { mantelWidth: value })),
  setMantelFinishId: (value) => set((state) => saveNext(state, { mantelFinishId: value })),
  setHearthEnabled: (value) =>
    set((state) =>
      saveNext(state, {
        hearthEnabled: value,
        fireplaceElevation:
          value && state.fireplaceElevation < 1.5 ? 12 : state.fireplaceElevation,
      }),
    ),
  setHearthStoneCount: (value) => set((state) => saveNext(state, { hearthStoneCount: value })),
  setCameraMode: (value) => set((state) => saveNext(state, { cameraMode: value })),
  setShowDimensions: (value) => set((state) => saveNext(state, { showDimensions: value })),
  reset: () => {
    clearPersistedConfiguration(window.localStorage);
    set({ ...DEFAULT_CONFIGURATION, recoveredMessage: null });
  },
}));
