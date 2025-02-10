import { FC, useState } from "react";
import { updateInstance } from "api/instances";
import type { LxdInstance } from "types/instance";
import { useParams } from "react-router-dom";
import { ActionButton } from "@canonical/react-components";
import { getInstanceEditValues, getInstancePayload } from "util/instanceEdit";
import type { LxdIsoDevice } from "types/device";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { usePortal } from "@canonical/react-components";
import type { RemoteImage } from "types/image";
import CustomIsoModal from "pages/images/CustomIsoModal";
import { remoteImageToIsoDevice } from "util/formDevices";
import { useEventQueue } from "context/eventQueue";
import { useToastNotification } from "context/toastNotificationProvider";
import { instanceLinkFromOperation } from "util/instances";
import ResourceLink from "components/ResourceLink";
import InstanceLinkChip from "../InstanceLinkChip";

interface Props {
  instance: LxdInstance;
}

const AttachIsoBtn: FC<Props> = ({ instance }) => {
  const eventQueue = useEventQueue();
  const { project } = useParams<{ project: string }>();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const [isLoading, setLoading] = useState(false);

  const attachedIso = instance.devices["iso-volume"] as
    | LxdIsoDevice
    | undefined;

  const detachIso = () => {
    setLoading(true);
    const values = getInstanceEditValues(instance);
    values.devices = values.devices.filter((device) => {
      return device.name !== "iso-volume";
    });
    const instanceMinusIso = getInstancePayload(
      instance,
      values,
    ) as LxdInstance;
    const instanceLink = <InstanceLinkChip instance={instance} />;
    void updateInstance(instanceMinusIso, project ?? "")
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () =>
            toastNotify.success(
              <>
                ISO{" "}
                <ResourceLink
                  to={`/ui/project/${project}/storage/custom-isos`}
                  type="iso-volume"
                  value={attachedIso?.source ?? ""}
                />{" "}
                detached from {instanceLink}
              </>,
            ),
          (msg) =>
            toastNotify.failure(
              "Detaching ISO failed.",
              new Error(msg),
              instanceLink,
            ),
          () => {
            void queryClient.invalidateQueries({
              queryKey: [queryKeys.instances, instance.name, project],
            });
            setLoading(false);
          },
        );
      })
      .catch((e) => {
        setLoading(false);
        toastNotify.failure("Detaching ISO failed.", e, instanceLink);
      });
  };

  const handleSelect = (image: RemoteImage) => {
    setLoading(true);
    closePortal();
    const values = getInstanceEditValues(instance);
    const isoDevice = remoteImageToIsoDevice(image);
    values.devices.push(isoDevice);
    const instancePlusIso = getInstancePayload(instance, values) as LxdInstance;
    void updateInstance(instancePlusIso, project ?? "")
      .then((operation) => {
        const instanceLink = instanceLinkFromOperation({
          operation,
          project,
          instanceType: instance.type,
        });
        eventQueue.set(
          operation.metadata.id,
          () =>
            toastNotify.success(
              <>
                ISO{" "}
                <ResourceLink
                  to={`/ui/project/${project}/storage/custom-isos`}
                  type="iso-volume"
                  value={image.aliases}
                />{" "}
                attached to {instanceLink}
              </>,
            ),
          (msg) =>
            toastNotify.failure(
              "Attaching ISO failed.",
              new Error(msg),
              instanceLink,
            ),
          () => {
            void queryClient.invalidateQueries({
              queryKey: [queryKeys.instances, instance.name, project],
            });
            setLoading(false);
          },
        );
      })
      .catch((e) => {
        setLoading(false);
        toastNotify.failure("Attaching ISO failed.", e);
      });
  };

  return attachedIso ? (
    <>
      <span className="u-text--muted margin-right">{attachedIso.source}</span>
      <ActionButton
        loading={isLoading}
        onClick={detachIso}
        className="u-no-margin--bottom"
      >
        Detach ISO
      </ActionButton>
    </>
  ) : (
    <>
      <ActionButton
        loading={isLoading}
        onClick={openPortal}
        className="u-no-margin--bottom"
      >
        Attach ISO
      </ActionButton>
      {isOpen && (
        <Portal>
          <CustomIsoModal onClose={closePortal} onSelect={handleSelect} />
        </Portal>
      )}
    </>
  );
};

export default AttachIsoBtn;
