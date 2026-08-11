'use strict';
const { createLibraryRouter } = require('./libraryRouter.factory');
const TeamMember  = require('../models/TeamMember');
const Client      = require('../models/Client');
const Technology  = require('../models/Technology');
const Tag         = require('../models/Tag');
const Testimonial = require('../models/Testimonial');
const Award       = require('../models/Award');
const Category    = require('../models/Category');
const Industry    = require('../models/Industry');
const Service     = require('../models/Service');
const ProjectType = require('../models/ProjectType');

/**
 * Mounts one CRUD router per reusable content library (see the CMS
 * normalization plan). Each is entirely admin-only — the public site never
 * browses these directly, only via populated PortfolioProject fields — so
 * the factory applies requireAdmin globally rather than splitting
 * public/admin sub-paths the way portfolio.routes.js does.
 */
const mountLibraryRoutes = (app) => {
  app.use('/api/team', createLibraryRouter(TeamMember, {
    entityName: 'team_member',
    searchFields: ['name', 'nameAr', 'position', 'positionAr'],
    slugSource: 'name',
    assetFields: ['avatar'],
  }));

  app.use('/api/clients', createLibraryRouter(Client, {
    entityName: 'client',
    searchFields: ['name', 'nameAr', 'country'],
    slugSource: 'name',
    populate: 'industry',
    assetFields: ['logo'],
  }));

  app.use('/api/technologies', createLibraryRouter(Technology, {
    entityName: 'technology',
    searchFields: ['name', 'category'],
    slugSource: 'name',
    defaultSort: { usageCount: -1, name: 1 },
  }));

  app.use('/api/tags', createLibraryRouter(Tag, {
    entityName: 'tag',
    searchFields: ['name', 'nameAr'],
    slugSource: 'name',
  }));

  app.use('/api/testimonials', createLibraryRouter(Testimonial, {
    entityName: 'testimonial',
    searchFields: ['author', 'authorAr', 'quote'],
    populate: 'client',
    defaultSort: { createdAt: -1 },
    assetFields: ['avatar', 'audio'],
  }));

  app.use('/api/awards', createLibraryRouter(Award, {
    entityName: 'award',
    searchFields: ['title', 'titleAr', 'org'],
    defaultSort: { year: -1, createdAt: -1 },
  }));

  app.use('/api/categories', createLibraryRouter(Category, {
    entityName: 'category',
    searchFields: ['name', 'nameAr'],
    slugSource: 'name',
    defaultSort: { order: 1, name: 1 },
  }));

  app.use('/api/industries', createLibraryRouter(Industry, {
    entityName: 'industry',
    searchFields: ['name', 'nameAr'],
    slugSource: 'name',
    defaultSort: { order: 1, name: 1 },
  }));

  app.use('/api/services', createLibraryRouter(Service, {
    entityName: 'service',
    searchFields: ['name', 'nameAr'],
    slugSource: 'name',
    defaultSort: { order: 1, name: 1 },
  }));

  // Phase 1 of the Design Showcase work — see PROJECT_REVIEW.md §2/§3.
  app.use('/api/project-types', createLibraryRouter(ProjectType, {
    entityName: 'project_type',
    searchFields: ['name', 'nameAr'],
    slugSource: 'name',
    defaultSort: { order: 1, name: 1 },
  }));
};

module.exports = { mountLibraryRoutes };
