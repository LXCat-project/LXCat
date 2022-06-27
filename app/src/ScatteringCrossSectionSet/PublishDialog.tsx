import { Dialog } from "../shared/Dialog";
import { publishSet } from "./client";

interface Props {
  isOpened: boolean;
  selectedSetId: string;
  onClose: (confirmed: boolean) => void;
}

export const PublishDialog = ({ isOpened, selectedSetId, onClose }: Props) => {
  async function onSubmit(pressedButton: string) {
    const confirmed = pressedButton === "default";
    if (confirmed) {
      await publishSet(selectedSetId);
    }
    onClose(confirmed);
  }
  return (
    <Dialog isOpened={isOpened} onSubmit={onSubmit}>
      <form method="dialog">
        <p>You are about to publish the set.</p>
        <p>This will make the set visible to everyone.</p>
        <p>Please only press publish when you are ready.</p>
        <button value="cancel">Cancel</button>
        <button value="default" type="submit">
          Publish
        </button>
      </form>
    </Dialog>
  );
};
