import React from 'react';
import GuideClient from './GuideClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panduan Pengguna Clashub',
  description: 'Pelajari cara menggunakan fitur Clashub, mulai dari manajemen klan, perang, hingga turnamen.',
};

export default function GuidePage() {
  return <GuideClient />;
}