import HttpStatusCodes from '@server/common/status_codes';

/******************************************************************************
                                 Classes
******************************************************************************/

/**
 * Error with status code and message.
 */
export class RouteError extends Error {
  public status: HttpStatusCodes;

  public constructor(status: HttpStatusCodes, messageOrError: string | Error) {
    let message: string;
    if (messageOrError instanceof Error) {
      message = messageOrError.message ?? 'An unknown error occurred';
    } else {
      message = messageOrError;
    }

    super(message);
    this.status = status;
  }
}
