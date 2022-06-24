import { browser } from 'webextension-polyfill-ts';
import { useCallback, useState, useRef, RefObject } from 'react';
import { includes, without } from 'lodash-es';
import cx from 'classnames';

import * as styles from './CredentialCard.module.css';

import {
  Credential,
  SharedCredential,
  usePendingCredentialCheck,
} from '../../utilities/credentials/credentials';
import { useBooleanState } from '../../utilities/useBooleanState/useBooleanState';

import { useScrollIntoView } from './CredentialCard';

interface Props {
  credential: Credential;
  onSelect: (value: SharedCredential) => void;
  onUnSelect: (rootHash: string) => void;
  viewRef: RefObject<HTMLElement>;
}

export function SignDidCredentialCard({
  credential,
  onSelect,
  onUnSelect,
  viewRef,
}: Props): JSX.Element {
  const t = browser.i18n.getMessage;

  usePendingCredentialCheck(credential);

  const isAttested = credential.status === 'attested';

  const isExpanded = useBooleanState();
  const isSelected = useBooleanState();

  const [contentsChecked, setContentsChecked] = useState<string[]>([]);

  const handleChecked = useCallback(
    (event) => {
      const name = event.target.name;
      const checked = event.target.checked;

      if (checked && !isSelected.current) {
        isSelected.on();
      }

      const newContents = checked
        ? [...contentsChecked, name]
        : without(contentsChecked, name);

      setContentsChecked(newContents);
      onSelect({ credential, sharedContents: newContents });
    },
    [contentsChecked, credential, onSelect, isSelected],
  );

  const handleSelect = useCallback(
    (event) => {
      if (!isAttested) {
        return;
      }

      if (event.target.checked) {
        isSelected.on();
        onSelect({ credential, sharedContents: contentsChecked });
      } else {
        isSelected.off();
        isExpanded.off();
        setContentsChecked([]);
        onUnSelect(credential.request.rootHash);
      }
    },
    [
      credential,
      contentsChecked,
      onSelect,
      onUnSelect,
      isExpanded,
      isSelected,
      isAttested,
    ],
  );

  const statuses = {
    pending: t('component_CredentialCard_pending'),
    attested: t('component_CredentialCard_attested'),
    revoked: t('component_CredentialCard_revoked'),
    invalid: t('component_CredentialCard_invalid'),
  };

  const contents = Object.entries(credential.request.claim.contents);

  const cardRef = useRef<HTMLLIElement>(null);

  useScrollIntoView(isExpanded.current, cardRef, viewRef);

  return (
    <li
      className={styles.selectable}
      aria-expanded={isExpanded.current}
      ref={cardRef}
    >
      <input
        name="credential"
        type="checkbox"
        id={credential.request.rootHash}
        onChange={handleSelect}
        checked={isSelected.current}
        disabled={!isAttested}
        className={styles.selectMultiple}
        aria-labelledby={
          isExpanded.current ? 'expandedLabel' : 'collapsedLabel'
        }
      />

      {!isExpanded.current && (
        <button className={styles.expand} onClick={isExpanded.on}>
          <section
            className={cx(styles.collapsedShareCredential, {
              [styles.notAttested]: !isAttested,
            })}
          >
            <h4 className={styles.collapsedName} id="collapsedLabel">
              {credential.name}
            </h4>
            <p className={styles.collapsedValue}>{credential.attester}</p>
          </section>
        </button>
      )}

      {isExpanded.current && (
        <section className={styles.shareExpanded}>
          <section className={styles.buttons}>
            <button
              type="button"
              aria-label={t('component_CredentialCard_collapse')}
              className={styles.collapse}
              onClick={isExpanded.off}
            />
          </section>

          <section className={!isAttested ? styles.notAttested : undefined}>
            <dl className={styles.details}>
              <div className={styles.detail}>
                <dt className={styles.detailName}>
                  {t('component_CredentialCard_name')}
                </dt>
                <dd className={styles.detailValue} id="expandedLabel">
                  {credential.name}
                </dd>
              </div>
              <div className={styles.detail}>
                <dt className={styles.detailName}>
                  {t('component_CredentialCard_status')}
                </dt>
                <dd className={styles.detailValue}>
                  {statuses[credential.status]}
                </dd>
              </div>

              {contents.map(([name, value]) => (
                <div key={name} className={styles.detail}>
                  <dt className={styles.detailName}>{name}</dt>
                  <dd className={styles.detailValue}>
                    <label className={styles.shareLabel}>
                      <input
                        type="checkbox"
                        name={name}
                        className={styles.share}
                        checked={includes(contentsChecked, name)}
                        onChange={handleChecked}
                        disabled={!isAttested}
                      />
                      <span />
                      {value}
                    </label>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <h4 className={styles.shareTechnical}>
            {t('component_CredentialCard_technical')}
          </h4>

          <dl className={styles.details}>
            <div className={styles.detail}>
              <dt className={styles.detailName}>
                {t('component_CredentialCard_ctype')}
              </dt>
              <dd className={styles.detailValue}>{credential.cTypeTitle}</dd>
            </div>
            <div className={styles.detail}>
              <dt className={styles.detailName}>
                {t('component_CredentialCard_attester')}
              </dt>
              <dd className={styles.detailValue}>{credential.attester}</dd>
            </div>
            <div className={styles.hash}>
              <dt className={styles.detailName}>
                {t('component_CredentialCard_hash')}
              </dt>
              <dd className={styles.detailValue}>
                {credential.request.rootHash}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </li>
  );
}
