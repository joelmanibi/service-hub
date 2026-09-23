/**
 * Simule un délai réseau pour matérialiser l'état de chargement des
 * formulaires d'authentification (spinner, bouton désactivé) tant
 * qu'aucune API n'est branchée (services/auth.service.ts). Factorisé
 * pour éviter de dupliquer ce délai dans chaque formulaire.
 */
export async function simulateAuthSubmit<T>(values: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  console.log(values);
  return values;
}
