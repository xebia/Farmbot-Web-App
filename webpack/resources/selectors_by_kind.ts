import { ResourceIndex } from "./interfaces";
import {
  TaggedResource,
  SpecialStatus,
  TaggedWebcamFeed,
  TaggedFbosConfig,
  TaggedCrop,
  TaggedRegimen,
  TaggedImage,
  TaggedLog,
  TaggedTool,
  TaggedFarmEvent,
  TaggedSequence,
  TaggedPoint,
  TaggedSensor,
  TaggedPeripheral,
  TaggedWebAppConfig,
  TaggedFirmwareConfig,
  TaggedToolSlotPointer,
  TaggedPinBinding,
  TaggedDiagnosticDump,
  TaggedSensorReading,
  TaggedSavedGarden,
  TaggedPlantTemplate,
  TaggedFarmwareEnv,
  TaggedFarmwareInstallation,
} from "farmbot";
import {
  isTaggedResource,
  sanityCheck,
} from "./tagged_resources";
import { sortResourcesById, betterCompact, bail } from "../util";
import { error } from "farmbot-toastr";
import { assertUuid } from "./util";
import { joinKindAndId } from "./reducer_support";

const isSaved = <T extends TaggedResource>(t: T) =>
  t.specialStatus === SpecialStatus.SAVED;

/** Generalized way to stamp out "finder" functions.
 * Pass in a `ResourceName` and it will add all the relevant checks.
 * WARNING: WILL THROW ERRORS IF RESOURCE NOT FOUND!
 */
const uuidFinder = <T extends TaggedResource>(r: T["kind"]) =>
  function findResource(i: ResourceIndex, u: string): T {
    assertUuid(r, u);
    const result = i.references[u];
    if (result && isTaggedResource(result) && sanityCheck(result)) {
      return result as T;
    } else {
      error("Resource error");
      throw new Error(`Tagged resource ${r} was not found or malformed: ` +
        JSON.stringify(result));
    }
  };

export function findAll<T extends TaggedResource>(
  index: ResourceIndex, kind: T["kind"]): T[] {
  const results: T[] = [];

  Object.keys(index.byKind[kind]).map(function (uuid) {
    const item = index.references[uuid];
    if (item && isTaggedResource(item) && (item.kind === kind)) {
      results.push(item as T);
    }
  });
  return sortResourcesById(results) as T[];
}

export let findTool = uuidFinder<TaggedTool>("Tool");
export let findSequence = uuidFinder<TaggedSequence>("Sequence");
export let findRegimen = uuidFinder<TaggedRegimen>("Regimen");
export let findFarmEvent = uuidFinder<TaggedFarmEvent>("FarmEvent");
export let findPoints = uuidFinder<TaggedPoint>("Point");

export const selectAllCrops = (i: ResourceIndex) => findAll<TaggedCrop>(i, "Crop");
export const selectAllSavedGardens = (i: ResourceIndex) =>
  findAll<TaggedSavedGarden>(i, "SavedGarden");
export const selectAllPlantTemplates = (i: ResourceIndex) =>
  findAll<TaggedPlantTemplate>(i, "PlantTemplate");
export const selectAllFarmEvents = (i: ResourceIndex) =>
  findAll<TaggedFarmEvent>(i, "FarmEvent");
export const selectAllImages = (i: ResourceIndex) => findAll<TaggedImage>(i, "Image");
export const selectAllLogs = (i: ResourceIndex) => findAll<TaggedLog>(i, "Log");
export const selectAllPeripherals =
  (i: ResourceIndex) => findAll<TaggedPeripheral>(i, "Peripheral");
export const selectAllPoints = (i: ResourceIndex) => findAll<TaggedPoint>(i, "Point");
export const selectAllActivePoints = (input: ResourceIndex) =>
  selectAllPoints(input).filter(x => !x.body.discarded_at);

export const selectAllToolSlots = (i: ResourceIndex): TaggedToolSlotPointer[] => {
  return betterCompact(selectAllActivePoints(i)
    .map((x): TaggedToolSlotPointer | undefined => {
      const y = x.body; // Hack around TS taggedUnion issues (I think).
      return (y.pointer_type === "ToolSlot") ? { ...x, body: y } : undefined;
    }));
};

export const selectAllDiagnosticDumps =
  (i: ResourceIndex) => findAll<TaggedDiagnosticDump>(i, "DiagnosticDump");
export const selectAllFarmwareEnvs =
  (i: ResourceIndex) => findAll<TaggedFarmwareEnv>(i, "FarmwareEnv");
export const selectAllFarmwareInstallations = (i: ResourceIndex) =>
  findAll<TaggedFarmwareInstallation>(i, "FarmwareInstallation");
export const selectAllRegimens = (i: ResourceIndex) =>
  findAll<TaggedRegimen>(i, "Regimen");
export const selectAllSensors = (i: ResourceIndex) => findAll<TaggedSensor>(i, "Sensor");
export const selectAllPinBindings =
  (i: ResourceIndex) => findAll<TaggedPinBinding>(i, "PinBinding");
export const selectAllSequences = (i: ResourceIndex) =>
  findAll<TaggedSequence>(i, "Sequence");
export const selectAllSensorReadings = (i: ResourceIndex) =>
  findAll<TaggedSensorReading>(i, "SensorReading");
export const selectAllTools = (i: ResourceIndex) => findAll<TaggedTool>(i, "Tool");
export const selectAllSavedSensors =
  (input: ResourceIndex) => selectAllSensors(input).filter(isSaved);
export const selectAllWebcamFeeds =
  (i: ResourceIndex) => findAll<TaggedWebcamFeed>(i, "WebcamFeed");
export const getAllSavedPeripherals =
  (input: ResourceIndex) => selectAllPeripherals(input).filter(isSaved);
export const getFbosConfig = (i: ResourceIndex): TaggedFbosConfig | undefined =>
  findAll<TaggedFbosConfig>(i, "FbosConfig")[0];
export const getWebAppConfig = (i: ResourceIndex): TaggedWebAppConfig | undefined =>
  findAll<TaggedWebAppConfig>(i, "WebAppConfig")[0];
export const getFirmwareConfig = (i: ResourceIndex): TaggedFirmwareConfig | undefined =>
  findAll<TaggedFirmwareConfig>(i, "FirmwareConfig")[0];

export const findByKindAndId = <T extends TaggedResource>(
  i: ResourceIndex, kind: T["kind"], id: number | undefined): T => {
  const kni = joinKindAndId(kind, id);
  const uuid = i.byKindAndId[kni] || bail("Not found: " + kni);
  const resource = i.references[uuid] || bail("Not found uuid: " + uuid);
  if (resource.kind === kind) {
    return resource as T; // Why `as T`?
  } else {
    return bail("Impossible! " + uuid);
  }
};
