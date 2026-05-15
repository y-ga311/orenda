import type { StaticImageData } from "next/image";
import { avatarIconIds, type AvatarIconId } from "@/lib/avatarIconIds";
import pixel01 from "@/source-images/pixel01.png";
import pixel02 from "@/source-images/pixel02.png";
import pixel03 from "@/source-images/pixel03.png";
import pixel04 from "@/source-images/pixel04.png";
import pixel05 from "@/source-images/pixel05.png";
import pixel06 from "@/source-images/pixel06.png";
import pixel07 from "@/source-images/pixel07.png";
import pixel08 from "@/source-images/pixel08.png";
import pixel09 from "@/source-images/pixel09.png";

export type AvatarIcon = {
  id: AvatarIconId;
  label: string;
  image: StaticImageData;
};

export type { AvatarIconId };

export const avatarIcons: AvatarIcon[] = [
  {
    id: "pixel01",
    label: "アイコン1",
    image: pixel01,
  },
  {
    id: "pixel02",
    label: "アイコン2",
    image: pixel02,
  },
  {
    id: "pixel03",
    label: "アイコン3",
    image: pixel03,
  },
  {
    id: "pixel04",
    label: "アイコン4",
    image: pixel04,
  },
  {
    id: "pixel05",
    label: "アイコン5",
    image: pixel05,
  },
  {
    id: "pixel06",
    label: "アイコン6",
    image: pixel06,
  },
  {
    id: "pixel07",
    label: "アイコン7",
    image: pixel07,
  },
  {
    id: "pixel08",
    label: "アイコン8",
    image: pixel08,
  },
  {
    id: "pixel09",
    label: "アイコン9",
    image: pixel09,
  },
];

export function getAvatarIcon(iconId: string | null | undefined) {
  return avatarIcons.find((icon) => icon.id === iconId) ?? avatarIcons[0];
}

export { avatarIconIds };
