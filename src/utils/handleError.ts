import {NotificationInstance} from "antd/es/notification/interface";

function handleError(e: unknown, api: NotificationInstance) {
  let errorMessage = 'Something went wrong';

  if (e instanceof Error) {
    errorMessage = e.message;
  } else if (e && typeof e === 'object' && 'message' in e) {
    errorMessage = (e as { message: string }).message;
  }

  console.error(errorMessage);
  api.warning({
    message: errorMessage,
    placement: 'bottomLeft',
  });
}

export { handleError }