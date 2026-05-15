export const avatarIconIds = [
  "pixel01",
  "pixel02",
  "pixel03",
  "pixel04",
  "pixel05",
  "pixel06",
  "pixel07",
  "pixel08",
  "pixel09",
] as const;

export type AvatarIconId = (typeof avatarIconIds)[number];

export function isAvatarIconId(value: string): value is AvatarIconId {
  return avatarIconIds.includes(value as AvatarIconId);
}
