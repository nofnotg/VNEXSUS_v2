import { describe, expect, it } from "vitest";
import {
  buildHospitalAliasKey,
  canonicalizeHospitalName,
  collapseHospitalVariants
} from "./hospital-normalization";

describe("hospital normalization", () => {
  it("canonicalizes SM radiology aliases into one hospital family", () => {
    expect(canonicalizeHospitalName("SM Radiology Clinic")).toBe("\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC");
    expect(canonicalizeHospitalName("SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0")).toBe(
      "\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC"
    );
    expect(buildHospitalAliasKey("SM Radiology Clinic")).toBe("family:sm-radiology");
    expect(buildHospitalAliasKey("\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC")).toBe("family:sm-radiology");
    expect(
      collapseHospitalVariants(["SM Radiology Clinic", "SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0", "\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC"])
    ).toEqual(["\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC"]);
  });

  it("collapses generic legal prefixes for Ilsan hospital aliases", () => {
    expect(canonicalizeHospitalName("\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8\uACF5\uB2E8 \uC77C\uC0B0\uBCD1\uC6D0")).toBe(
      "\uC77C\uC0B0\uBCD1\uC6D0"
    );
    expect(buildHospitalAliasKey("\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8 \uC77C\uC0B0\uBCD1\uC6D0")).toBe("family:ilsan-hospital");
  });

  it("prefers the specific Ilsan CHA name over the generic CHA alias", () => {
    expect(buildHospitalAliasKey("\uCC28\uBCD1\uC6D0")).toBe("family:ilsan-cha");
    expect(buildHospitalAliasKey("\uC77C\uC0B0\uCC28\uBCD1\uC6D0")).toBe("family:ilsan-cha");
    expect(collapseHospitalVariants(["\uCC28\uBCD1\uC6D0", "\uC77C\uC0B0\uCC28\uBCD1\uC6D0"])).toEqual([
      "\uC77C\uC0B0\uCC28\uBCD1\uC6D0"
    ]);
  });
});
