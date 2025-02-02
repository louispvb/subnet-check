import test from 'ava';
import {
  isInSubnet,
  isIPv4MappedAddress,
  isLocalhost,
  isPrivate,
  isReserved,
  isSpecial
} from '../src/index';
import ipv4fixtures from './fixtures/ipv4';
import ipv6fixtures from './fixtures/ipv6';

const fixtures = ipv4fixtures.slice().concat(ipv6fixtures);

test('subnet membership (one-at-a-time)', async t => {
  fixtures.forEach(([ip, subnet, expected]) => {
    t.is(isInSubnet(ip, subnet), expected);
  });
});

test('subnet membership (array)', async t => {
  const uniqueIps = new Set<string>(fixtures.map(f => f[0]));

  uniqueIps.forEach(ip => {
    const inSubnets = fixtures.filter(t => t[0] === ip && t[2]).map(t => t[1]);
    if (inSubnets.length) {
      t.true(isInSubnet(ip, inSubnets));
    }

    const notInSubnets = fixtures.filter(t => t[0] === ip && !t[2]).map(t => t[1]);
    t.false(isInSubnet(ip, notInSubnets));
  });
});

test('subnet membership (mixed IPv4 and IPv6 array)', async t => {
  const TRUSTED_ADDRESSES = ['127.0.0.1/8', '::1/128', '10.0.0.0/8', 'fc00::/7'];
  t.true(isInSubnet('127.1.2.3', TRUSTED_ADDRESSES));
  t.true(isInSubnet('10.254.254.254', TRUSTED_ADDRESSES));
  t.false(isInSubnet('1.2.3.4', TRUSTED_ADDRESSES));

  t.true(isInSubnet('::1', TRUSTED_ADDRESSES));
  t.true(isInSubnet('fc00::1', TRUSTED_ADDRESSES));
  t.false(isInSubnet('fe80::5555:1111:2222:7777', TRUSTED_ADDRESSES));
});

test('ipv4 encapsulated in ipv6', async t => {
  t.true(isInSubnet('::ffff:172.16.10.10', '172.16.0.0/16'));
  t.true(isInSubnet('::ffff:172.16.10.10', '::ffff:172.16.0.0/112'));
  t.false(isInSubnet('::ffff:192.168.10.10', '172.16.0.0/16'));
  t.false(isInSubnet('::ffff:192.168.10.10', '::ffff:172.16.0.0/112'));
});

test('private addresses', async t => {
  t.true(isPrivate('192.168.0.1'));
  t.true(isPrivate('fe80::5555:1111:2222:7777%utun2'));
  t.true(isPrivate('::ffff:192.168.0.1'));
});

test('localhost addresses', async t => {
  t.true(isLocalhost('127.0.0.1'));
  t.true(isLocalhost('::1'));
  t.true(isLocalhost('::ffff:127.0.0.1'));
});

test('IPv4 mapped addresses', async t => {
  t.false(isIPv4MappedAddress('8.8.8.8'));
  t.true(isIPv4MappedAddress('::ffff:8.8.8.8'));
});

test('reserved addresses', async t => {
  t.true(isReserved('169.254.100.200'));
  t.true(isReserved('2001:db8:f53a::1'));
  t.true(isReserved('::ffff:169.254.100.200'));
});

test('special addresses', async t => {
  t.true(isSpecial('127.0.0.1'));
  t.true(isSpecial('::'));
  t.true(isSpecial('::ffff:127.0.0.1'));
});
