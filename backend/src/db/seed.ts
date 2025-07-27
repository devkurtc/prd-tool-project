import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data
  await prisma.aIInteraction.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.collaborator.deleteMany()
  await prisma.pRDVersion.deleteMany()
  await prisma.pRD.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      password: hashedPassword,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      password: hashedPassword,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    },
  })

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      password: hashedPassword,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    },
  })

  // Create PRDs
  const prd1 = await prisma.pRD.create({
    data: {
      title: 'E-commerce Mobile App',
      description: 'A comprehensive mobile application for online shopping with AR features',
      content: `# E-commerce Mobile App PRD

## Overview
This document outlines the requirements for our new e-commerce mobile application with augmented reality features.

## Goals
- Increase mobile conversion rates by 25%
- Provide immersive AR shopping experience
- Reduce cart abandonment by 15%

## Features
### 1. AR Product Preview
Users can visualize products in their space using AR

### 2. One-Click Checkout
Streamlined checkout process with saved payment methods

### 3. Personalized Recommendations
AI-powered product recommendations based on browsing history`,
      status: 'REVIEW',
      authorId: alice.id,
      versions: {
        create: {
          version: 1,
          content: 'Initial version',
          changeLog: 'Created initial PRD structure',
          authorId: alice.id,
        },
      },
    },
  })

  const prd2 = await prisma.pRD.create({
    data: {
      title: 'AI Customer Support System',
      description: 'An intelligent customer support system using GPT-4 for automated responses',
      content: `# AI Customer Support System

## Executive Summary
Implement an AI-powered customer support system to handle 80% of customer inquiries automatically.

## Objectives
- Reduce average response time to under 1 minute
- Maintain 90%+ customer satisfaction
- Scale support without increasing headcount

## Technical Requirements
- Integration with GPT-4 API
- Multi-language support
- Sentiment analysis
- Escalation to human agents when needed`,
      status: 'DRAFT',
      authorId: bob.id,
    },
  })

  const prd3 = await prisma.pRD.create({
    data: {
      title: 'Developer Portal 2.0',
      description: 'Complete redesign of our developer documentation and API portal',
      content: `# Developer Portal 2.0

## Vision
Create the best-in-class developer experience for our API consumers.

## Key Features
1. Interactive API playground
2. Code examples in 10+ languages
3. Real-time collaboration on documentation
4. Integrated support chat
5. API usage analytics dashboard`,
      status: 'APPROVED',
      isPublic: true,
      authorId: alice.id,
    },
  })

  // Create collaborations
  await prisma.collaborator.create({
    data: {
      userId: bob.id,
      prdId: prd1.id,
      role: 'EDITOR',
    },
  })

  await prisma.collaborator.create({
    data: {
      userId: charlie.id,
      prdId: prd1.id,
      role: 'VIEWER',
    },
  })

  await prisma.collaborator.create({
    data: {
      userId: alice.id,
      prdId: prd2.id,
      role: 'EDITOR',
    },
  })

  // Create comments
  await prisma.comment.create({
    data: {
      content: 'Great idea! Have we considered the impact on battery life for AR features?',
      prdId: prd1.id,
      authorId: bob.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'We should add more details about the technical implementation.',
      prdId: prd1.id,
      authorId: charlie.id,
      resolved: true,
    },
  })

  // Create activities
  await prisma.activity.create({
    data: {
      type: 'CREATED',
      userId: alice.id,
      prdId: prd1.id,
      metadata: { title: 'E-commerce Mobile App' },
    },
  })

  await prisma.activity.create({
    data: {
      type: 'COMMENTED',
      userId: bob.id,
      prdId: prd1.id,
      metadata: { comment: 'Great idea! Have we considered...' },
    },
  })

  await prisma.activity.create({
    data: {
      type: 'SHARED',
      userId: alice.id,
      prdId: prd3.id,
      metadata: { sharedWith: ['bob@example.com', 'charlie@example.com'] },
    },
  })

  // Create AI interactions
  await prisma.aIInteraction.create({
    data: {
      prompt: '@expand Add more details about the AR implementation',
      response: 'The AR feature will utilize ARCore (Android) and ARKit (iOS) to provide...',
      model: 'gpt-4',
      tokens: 150,
      costCents: 0.45,
      prdId: prd1.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`
  Created:
  - 3 users (alice@example.com, bob@example.com, charlie@example.com)
  - 3 PRDs with various statuses
  - Multiple collaborations, comments, and activities
  - Sample AI interaction
  
  All test users have password: password123
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })