import { gqlRequest } from './graphql-client';

export async function updateCMSSection(sectionId: string, input: { name?: string; description?: string }) {
  try {
    console.log('Actualizando sección con ID:', sectionId, input);
    
    const query = `
      mutation UpdateCMSSection($sectionId: ID!, $input: UpdateCMSSectionInput!) {
        updateCMSSection(sectionId: $sectionId, input: $input) {
          success
          message
          lastUpdated
        }
      }
    `;
    
    const variables = {
      sectionId,
      input
    };
    
    const result = await gqlRequest<{
      updateCMSSection: {
        success: boolean;
        message: string;
        lastUpdated: string | null;
      }
    }>(query, variables);
    
    if (!result || !result.updateCMSSection) {
      console.error('La respuesta no contiene updateCMSSection:', result);
      return {
        success: false,
        message: 'Error al actualizar la sección: Respuesta inválida del servidor',
        lastUpdated: null
      };
    }
    
    console.log('Resultado de actualización:', result.updateCMSSection);
    
    return result.updateCMSSection;
  } catch (error) {
    console.error('Error al actualizar la sección:', error);
    return {
      success: false,
      message: `Error al actualizar la sección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      lastUpdated: null
    };
  }
} 