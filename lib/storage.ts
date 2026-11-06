export const ASSET_BUCKET = 'assets'

export function storageObjectPath(ownerId: string, assetId: string, relativePath: string) {
  return `${ownerId}/${assetId}/${relativePath}`
}
