import type { StaticImageData } from "next/image";
import { studyTypeIds, type StudyTypeId } from "@/lib/studyTypeIds";
import type1Image from "@/source-images/type1.png";
import type2Image from "@/source-images/type2.png";
import type3Image from "@/source-images/type3.png";
import type4Image from "@/source-images/type4.png";
import type5Image from "@/source-images/type5.png";
import type6Image from "@/source-images/type6.png";

export type StudyType = {
  id: StudyTypeId;
  label: string;
  image: StaticImageData;
};

export type { StudyTypeId };

const studyTypeImages: Record<StudyTypeId, StaticImageData> = {
  1: type1Image,
  2: type2Image,
  3: type3Image,
  4: type4Image,
  5: type5Image,
  6: type6Image,
};

export const studyTypes: StudyType[] = studyTypeIds.map((id) => ({
  id,
  label: `タイプ${id}`,
  image: studyTypeImages[id],
}));

export function getStudyType(studyTypeId: StudyTypeId): StudyType {
  return studyTypes.find((type) => type.id === studyTypeId) ?? studyTypes[0];
}

export { studyTypeIds };
