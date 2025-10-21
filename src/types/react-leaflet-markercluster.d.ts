declare module "@changey/react-leaflet-markercluster" {
  import { ComponentType } from "react";
  import { LayerGroupProps } from "react-leaflet";
  const MarkerClusterGroup: ComponentType<
    LayerGroupProps & Record<string, any>
  >;
  export default MarkerClusterGroup;
}
