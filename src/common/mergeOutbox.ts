type AnyRecord = Record<string, any>;

/**
 * mergePatch
 * - 나중 값(새 patch)이 이김
 * - 기존에 없던 키는 유지됨
 * - shallow merge (중첩 객체까지 deep merge하라고 안 하셨으니까 얕게만)
 */
export function mergePatch<T extends AnyRecord, U extends AnyRecord>(
  oldPatch: T,
  newPatch: U,
): T & U {
  return {
    ...oldPatch,
    ...newPatch,
  };
  // 이유:
  // 스프레드 후반(newPatch)이 동일 키를 덮어씀.
  // 예:
  // old: { name: "Cam A", intrinsicStage: "captured" }
  // new: { name: "Front Gate Camera", extrinsicStage: "submitted" }
  // => { name: "Front Gate Camera", intrinsicStage: "captured", extrinsicStage: "submitted" }
}

/**
 * mergePreconds
 * - preconds는 "내가 처음 봤던 서버 상태의 버전들"
 * - 이미 oldPreconds에 있는 키는 유지 (우선순위: old)
 * - oldPreconds에 없던 키만 newPreconds에서 채워넣음
 * - 즉 필드별로 earliest snapshot을 계속 유지
 */
export function mergePreconds<T extends AnyRecord, U extends AnyRecord>(
  oldPreconds: T,
  newPreconds: U,
): T & U {
  const result: AnyRecord = { ...oldPreconds };

  for (const [key, value] of Object.entries(newPreconds)) {
    if (!(key in result)) {
      result[key] = value;
    }
  }

  return result as T & U;
  /*
    예:
    old: { nameVer: 0, intrinsicStageVer: 0 }
    new: { nameVer: 0, extrinsicStageVer: 0 }
    =>
    result: { nameVer: 0, intrinsicStageVer: 0, extrinsicStageVer: 0 }

    중요한 점:
    - nameVer는 old에 이미 있으므로 old(=0) 유지
    - extrinsicStageVer는 old에 없었으므로 new에서 가져와 추가
    - 절대 덮어쓰지 않음
  */
}
