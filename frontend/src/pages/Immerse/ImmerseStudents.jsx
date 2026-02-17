/**
 * ImmerseStudents - Filtered view showing only student contacts
 * Wrapper component for ImmerseContacts with student filter
 */

import ImmerseContacts from './ImmerseContacts';

const ImmerseStudents = () => {
  return <ImmerseContacts filterType="student" />;
};

export default ImmerseStudents;
