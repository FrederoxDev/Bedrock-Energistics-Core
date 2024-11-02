import * as ipc from "mcbe-addon-ipc";

export function ipcSend(event: string, payload: ipc.SerializableValue): void {
  void ipc.sendAuto({
    event,
    payload,
    namespace: "fluffyalien_energisticscore",
  });
}

export function ipcInvoke(
  event: string,
  payload: ipc.SerializableValue,
): Promise<ipc.SerializableValue> {
  return ipc.invokeAuto({
    event,
    payload,
    namespace: "fluffyalien_energisticscore",
  });
}
