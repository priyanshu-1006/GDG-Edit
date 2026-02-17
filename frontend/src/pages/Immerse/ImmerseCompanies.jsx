/**
 * ImmerseCompanies - Filtered view showing only company contacts
 * Wrapper component for ImmerseContacts with company filter
 */

import ImmerseContacts from './ImmerseContacts';

const ImmerseCompanies = () => {
  return <ImmerseContacts filterType="company" />;
};

export default ImmerseCompanies;
