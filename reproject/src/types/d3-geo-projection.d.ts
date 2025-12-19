declare module "d3-geo-projection" {
  import type { GeoProjection } from "d3-geo";

  export function geoRobinson(): GeoProjection;
  export function geoMollweide(): GeoProjection;
  export function geoWinkel3(): GeoProjection;
}
