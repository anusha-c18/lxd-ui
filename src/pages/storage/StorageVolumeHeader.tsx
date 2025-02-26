import { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RenameHeader, { RenameHeaderValues } from "components/RenameHeader";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { LxdStorageVolume } from "types/storage";
import { renameStorageVolume } from "api/storage-pools";
import { testDuplicateStorageVolumeName } from "util/storageVolume";
import { useNotify } from "@canonical/react-components";
import DeleteStorageVolumeBtn from "pages/storage/actions/DeleteStorageVolumeBtn";
import { useToastNotification } from "context/toastNotificationProvider";
import MigrateVolumeBtn from "./MigrateVolumeBtn";
import DuplicateVolumeBtn from "./actions/DuplicateVolumeBtn";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import ResourceLink from "components/ResourceLink";
import ResourceLabel from "components/ResourceLabel";

interface Props {
  volume: LxdStorageVolume;
  project: string;
}

const StorageVolumeHeader: FC<Props> = ({ volume, project }) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const controllerState = useState<AbortController | null>(null);
  const { hasClusterInternalCustomVolumeCopy } = useSupportedFeatures();

  const RenameSchema = Yup.object().shape({
    name: Yup.string()
      .test(
        ...testDuplicateStorageVolumeName(
          project,
          volume.type,
          controllerState,
          volume.name,
        ),
      )
      .required("This field is required"),
  });

  const formik = useFormik<RenameHeaderValues>({
    initialValues: {
      name: volume.name,
      isRenaming: false,
      pool: volume.pool,
    } as RenameHeaderValues,
    validationSchema: RenameSchema,
    onSubmit: (values) => {
      if (volume.name === values.name) {
        formik.setFieldValue("isRenaming", false);
        formik.setSubmitting(false);
        return;
      }
      renameStorageVolume(project, volume, values.name)
        .then(() => {
          const url = `/ui/project/${project}/storage/pool/${volume.pool}/volumes/${volume.type}/${values.name}`;
          navigate(url);
          toastNotify.success(
            <>
              Storage volume <strong>{volume.name}</strong> renamed to{" "}
              <ResourceLink type="volume" value={values.name} to={url} />.
            </>,
          );
          formik.setFieldValue("isRenaming", false);
        })
        .catch((e) => {
          notify.failure("Renaming failed", e);
        })
        .finally(() => {
          formik.setSubmitting(false);
        });
    },
  });

  const classname = "p-segmented-control__button";

  return (
    <RenameHeader
      name={volume.name}
      parentItems={[
        <Link to={`/ui/project/${project}/storage/volumes`} key={1}>
          Storage volumes
        </Link>,
      ]}
      controls={
        <div className="p-segmented-control">
          <div className="p-segmented-control__list">
            <MigrateVolumeBtn
              storageVolume={volume}
              project={project}
              classname={classname}
            />
            {hasClusterInternalCustomVolumeCopy && (
              <DuplicateVolumeBtn volume={volume} className={classname} />
            )}
            <DeleteStorageVolumeBtn
              label="Delete"
              volume={volume}
              project={project}
              appearance=""
              hasIcon={true}
              onFinish={() => {
                navigate(`/ui/project/${project}/storage/volumes`);
                toastNotify.success(
                  <>
                    Storage volume{" "}
                    <ResourceLabel bold type="volume" value={volume.name} />{" "}
                    deleted.
                  </>,
                );
              }}
              classname={classname}
            />
          </div>
        </div>
      }
      isLoaded={true}
      formik={formik}
      renameDisabledReason={
        (volume.used_by?.length ?? 0) > 0
          ? "Can not rename, volume is currently in use."
          : undefined
      }
    />
  );
};

export default StorageVolumeHeader;
