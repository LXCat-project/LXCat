import { Box, Checkbox, Space, Stack } from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons";

// TODO: sets can possibly be an array of objects.
interface OrganizationSummary {
  name: string;
  unfolded: boolean;
  sets: Record<string, string>;
}

export type CSSetSelection = Set<string>;
export type CSSetTree = Record<string, OrganizationSummary>;

export interface CSSetFilterProps {
  data: CSSetTree;
  selection: CSSetSelection;
  onOrganizationChecked: (id: string, checked: boolean) => void;
  onOrganizationUnfolded: (id: string, unfolded: boolean) => void;
  onSetChecked: (setId: string, checked: boolean) => void;
}

export const CSSetFilter = ({
  data,
  selection,
  onOrganizationChecked,
  onOrganizationUnfolded,
  onSetChecked,
}: CSSetFilterProps) => {
  return (
    <Stack spacing={0} align="flex-start">
      {Object.entries(data).map(([id, summary]) => {
        const numSelected = Object.keys(summary.sets).filter((setId) =>
          selection.has(setId)
        ).length;

        return (
          <Stack key={id} spacing={1}>
            <Box sx={{ display: "inline-flex" }}>
              {
                // FIXME: Duplicating onClick is not great, but adding Box or
                // div introduces weird displacement of the chevron.
                summary.unfolded ? (
                  <IconChevronDown
                    onClick={() => onOrganizationUnfolded(id, false)}
                  />
                ) : (
                  <IconChevronRight
                    onClick={() => onOrganizationUnfolded(id, true)}
                  />
                )
              }
              <Checkbox
                size="xs"
                checked={
                  numSelected > 0 &&
                  numSelected === Object.keys(summary.sets).length
                }
                indeterminate={
                  numSelected > 0 &&
                  numSelected < Object.keys(summary.sets).length
                }
                disabled={Object.keys(summary.sets).length === 0}
                label={summary.name}
                onChange={(event) =>
                  onOrganizationChecked(id, event.currentTarget.checked)
                }
              />
            </Box>
            {summary.unfolded ? (
              <Stack spacing={2}>
                {Object.entries(summary.sets).map(([setId, setName]) => (
                  <Box key={setId} sx={{ display: "inline-flex" }}>
                    <Space w="md" />
                    <Checkbox
                      size="xs"
                      checked={selection.has(setId)}
                      label={setName}
                      onChange={(event) =>
                        onSetChecked(setId, event.currentTarget.checked)
                      }
                    />
                  </Box>
                ))}
              </Stack>
            ) : (
              <></>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
};
