import {
  computeAuditDiff,
  sanitizeForAudit,
} from './audit-sanitize';

describe('audit-sanitize', () => {
  it('flattens environmentValues to readable labels', () => {
    const entity = {
      environmentValues: [
        {
          id: 1,
          enabled: true,
          environment: { id: 1, name: 'Dev', code: 'dev' },
        },
        {
          id: 2,
          enabled: false,
          environment: { id: 2, name: 'Prod', code: 'prod' },
        },
      ],
    };

    expect(sanitizeForAudit(entity)).toEqual({
      environmentValues: ['Dev: enabled', 'Prod: disabled'],
    });
  });

  it('diffs flattened environmentValues', () => {
    const before = {
      environmentValues: [
        {
          enabled: false,
          environment: { name: 'Dev' },
        },
      ],
    };
    const after = {
      environmentValues: [
        {
          enabled: true,
          environment: { name: 'Dev' },
        },
      ],
    };

    expect(computeAuditDiff(before, after)).toEqual({
      environmentValues: {
        old: ['Dev: disabled'],
        new: ['Dev: enabled'],
      },
    });
  });

  it('skips plainToken from audit snapshots and diffs', () => {
    expect(
      sanitizeForAudit({
        name: 'CI token',
        plainToken: 'ff_secret',
      }),
    ).toEqual({
      name: 'CI token',
    });

    expect(
      computeAuditDiff(
        { name: 'Token' },
        { name: 'Token', plainToken: 'ff_secret' },
      ),
    ).toEqual({});
  });
});
