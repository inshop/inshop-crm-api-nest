import { User } from '../../entities/user.entity';
import { Group } from '../../entities/group.entity';
import { Role } from '../../entities/role.entity';
import { hashPassword, isBcryptHash } from '../../../core/utils/password';
import { AppRole } from '../../constants/roles.constants';

describe('User entity', () => {
  it('hashes plain password on insert', () => {
    const user = new User();
    user.password = 'plain-password';
    user.generatePasswordHash();

    expect(isBcryptHash(user.password)).toBe(true);
  });

  it('does not re-hash bcrypt password', () => {
    const hash = hashPassword('plain-password');
    const user = new User();
    user.password = hash;
    user.generatePasswordHash();

    expect(user.password).toBe(hash);
  });

  it('maps group roles via roles()', () => {
    const role = new Role();
    role.role = AppRole.PROJECT_LIST;

    const group = new Group();
    group.roles = [role];

    const user = new User();
    user.group = group;

    expect(user.roles()).toEqual([AppRole.PROJECT_LIST]);
  });
});
