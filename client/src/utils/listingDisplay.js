export function formatFloor(floor, totalFloors) {
  if (floor === null || floor === undefined || floor === "") {
    return "-";
  }

  if (totalFloors === null || totalFloors === undefined || totalFloors === "") {
    return floor;
  }

  return `${floor}/${totalFloors}`;
}
