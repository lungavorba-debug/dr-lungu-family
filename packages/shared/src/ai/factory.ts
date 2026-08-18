import type { AiProviderId } from '@medscreen/types';
import type { AiProviderDefinition, AiScreeningProvider, ResolvedAiConfig } from './types';
import { HeuristicAiScreeningProvider } from './providers/heuristic.provider';
import {
  AzureOpenAiScreeningProvider,
  GeminiScreeningProvider,
  OpenAiScreeningProvider,
} from './providers/remote.providers';

const providerDefinitions: Record<Exclude<AiProviderId, 'none'>, AiProviderDefinition> = {
  openai: {
    id: 'openai',
    isConfigured: (config) => Boolean(config.api_key.trim() && config.model.trim()),
    create: (config) => new OpenAiScreeningProvider(config),
  },
  gemini: {
    id: 'gemini',
    isConfigured: (config) => Boolean(config.api_key.trim() && config.model.trim()),
    create: (config) => new GeminiScreeningProvider(config),
  },
  azure_openai: {
    id: 'azure_openai',
    isConfigured: (config) =>
      Boolean(
        config.api_key.trim() &&
          config.model.trim() &&
          config.api_base_url?.trim() &&
          config.deployment_name?.trim(),
      ),
    create: (config) => new AzureOpenAiScreeningProvider(config),
  },
};

export function listRegisteredAiProviderIds(): Exclude<AiProviderId, 'none'>[] {
  return Object.keys(providerDefinitions) as Exclude<AiProviderId, 'none'>[];
}

export function createAiScreeningProvider(config: ResolvedAiConfig): AiScreeningProvider {
  if (config.provider_id === 'none' || !config.enabled) {
    return new HeuristicAiScreeningProvider();
  }

  const definition = providerDefinitions[config.provider_id];
  if (!definition || !definition.isConfigured(config)) {
    return new HeuristicAiScreeningProvider();
  }

  return definition.create(config);
}

export function isRemoteAiProviderAvailable(config: ResolvedAiConfig): boolean {
  if (!config.enabled || config.provider_id === 'none') {
    return false;
  }
  const definition = providerDefinitions[config.provider_id];
  return Boolean(definition?.isConfigured(config));
}

export { HeuristicAiScreeningProvider };
