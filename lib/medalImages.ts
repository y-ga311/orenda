import type { StaticImageData } from "next/image";
import medal001C from "@/source-images/medal/001C.png";
import medal001G from "@/source-images/medal/001G.png";
import medal001S from "@/source-images/medal/001S.png";
import medal002G from "@/source-images/medal/002G.png";
import medal003C from "@/source-images/medal/003C.png";
import medal003G from "@/source-images/medal/003G.png";
import medal003S from "@/source-images/medal/003S.png";
import medal004C from "@/source-images/medal/004C.png";
import medal004G from "@/source-images/medal/004G.png";
import medal004S from "@/source-images/medal/004S.png";
import medal005G from "@/source-images/medal/005G.png";
import medal006C from "@/source-images/medal/006C.png";
import medal006G from "@/source-images/medal/006G.png";
import medal006S from "@/source-images/medal/006S.png";
import medal007C from "@/source-images/medal/007C.png";
import medal007G from "@/source-images/medal/007G.png";
import medal007S from "@/source-images/medal/007S.png";
import medal008G from "@/source-images/medal/008G.png";
import medal009C from "@/source-images/medal/009C.png";
import medal009G from "@/source-images/medal/009G.png";
import medal009S from "@/source-images/medal/009S.png";
import medal010C from "@/source-images/medal/010C.png";
import medal010G from "@/source-images/medal/010G.png";
import medal010S from "@/source-images/medal/010S.png";
import medal011G from "@/source-images/medal/011G.png";
import medal012G from "@/source-images/medal/012G.png";
import medal013G from "@/source-images/medal/013G.png";
import type { MedalTier } from "@/lib/medalDb";

const medalImageMap: Record<string, StaticImageData> = {
  "001C": medal001C,
  "001G": medal001G,
  "001S": medal001S,
  "002G": medal002G,
  "003C": medal003C,
  "003G": medal003G,
  "003S": medal003S,
  "004C": medal004C,
  "004G": medal004G,
  "004S": medal004S,
  "005G": medal005G,
  "006C": medal006C,
  "006G": medal006G,
  "006S": medal006S,
  "007C": medal007C,
  "007G": medal007G,
  "007S": medal007S,
  "008G": medal008G,
  "009C": medal009C,
  "009G": medal009G,
  "009S": medal009S,
  "010C": medal010C,
  "010G": medal010G,
  "010S": medal010S,
  "011G": medal011G,
  "012G": medal012G,
  "013G": medal013G,
};

export function getMedalImage(imageKey: string, medalNo?: string): StaticImageData {
  return (
    medalImageMap[imageKey] ??
    (medalNo ? medalImageMap[`${medalNo}G`] : undefined) ??
    medal001G
  );
}

export function getMedalImageByNoAndTier(
  medalNo: string,
  tier: MedalTier,
): StaticImageData {
  return getMedalImage(`${medalNo}${tier}`, medalNo);
}
