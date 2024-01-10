import React, { DependencyList, FC, ReactNode, useEffect, useRef } from "react";
import useEventListener from "@use-it/event-listener";
import { getAbsoluteHeightBelow, getParentsBottomSpacing } from "util/helpers";

interface Props {
  children: ReactNode;
  dependencies: DependencyList;
  belowId?: string;
  tableId: string;
}

const ScrollableTable: FC<Props> = ({
  dependencies,
  children,
  belowId = "",
  tableId,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const updateTBodyHeight = () => {
    const table = document.getElementById(tableId);
    if (!table || table.children.length !== 2) {
      return;
    }
    const tBody = table.children[1];
    const above = tBody.getBoundingClientRect().top + 1;
    const below = getAbsoluteHeightBelow(belowId);
    const parentsBottomSpacing = getParentsBottomSpacing(table);
    const offset = Math.ceil(above + below + parentsBottomSpacing);
    const style = `height: calc(100vh - ${offset}px); min-height: calc(100vh - ${offset}px)`;
    tBody.setAttribute("style", style);
  };

  useEventListener("resize", updateTBodyHeight);
  useEffect(updateTBodyHeight, [...dependencies, ref]);

  return (
    <div ref={ref} className="scrollable-table">
      {children}
    </div>
  );
};

export default ScrollableTable;
