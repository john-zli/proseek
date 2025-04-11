import { useState } from 'react';

import { ModalContainer } from '../../shared-components/modal_container';
import classes from './prayer_list_modal.module.less';

// TODO(johnli): Move this to API types file.
interface PrayerList {
  summary: string;
  text: string;
  requester: string;
  call: boolean;
}

export function PrayerListModal() {
  const [prayerList, _setPrayerList] = useState<PrayerList[]>([]);

  return (
    <ModalContainer>
      <thead className={classes.tableheader}>
        <tr className={classes.tableGrid}>
          <th>REQUESTER</th>
          <th>SUMMARY</th>
          <th>TEXT</th>
          <th>CALL</th>
        </tr>
      </thead>
      <tbody className={classes.tableheader}>
        {prayerList.map((request, index) => (
          <tr key={index} className={classes.tablerow}>
            <td className={classes.requestName}>{request.requester}</td>
            <td>{request.summary}</td>
            <td>
              {request.text ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="feather feather-thumbs-up"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              ) : null}
            </td>
            <td>
              {request.call ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="feather feather-thumbs-up"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </ModalContainer>
  );
}
