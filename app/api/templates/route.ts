import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { surveyTemplates } from '@/lib/surveyTemplates';

// GET all templates - loads from database if available, otherwise from code
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    
    try {
      // Try to load from database first
      const [dbTemplates] = await pool.execute(
        'SELECT id, name, description, icon, survey_data as surveyData FROM survey_templates ORDER BY created_at ASC'
      ) as any[];

      if (dbTemplates.length > 0) {
        // Use database templates
        const templates = dbTemplates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          icon: t.icon,
          survey: typeof t.surveyData === 'string' ? JSON.parse(t.surveyData) : t.surveyData,
        }));
        return NextResponse.json(templates);
      } else {
        // Database is empty - migrate templates from code
        console.log('No templates in database, migrating from code...');
        for (const template of surveyTemplates) {
          try {
            await pool.execute(
              'INSERT INTO survey_templates (id, name, description, icon, survey_data) VALUES (?, ?, ?, ?, ?)',
              [template.id, template.name, template.description, template.icon, JSON.stringify(template.survey)]
            );
            console.log(`Migrated template: ${template.name}`);
          } catch (insertError: any) {
            if (insertError.code !== 'ER_DUP_ENTRY') {
              console.error(`Error migrating template ${template.name}:`, insertError);
            }
          }
        }
        // Reload from database after migration
        const [newDbTemplates] = await pool.execute(
          'SELECT id, name, description, icon, survey_data as surveyData FROM survey_templates ORDER BY created_at ASC'
        ) as any[];
        if (newDbTemplates.length > 0) {
          const templates = newDbTemplates.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            icon: t.icon,
            survey: typeof t.surveyData === 'string' ? JSON.parse(t.surveyData) : t.surveyData,
          }));
          return NextResponse.json(templates);
        }
      }
    } catch (dbError: any) {
      // If table doesn't exist, fall back to code templates
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        console.warn('survey_templates table not found, using code templates');
        console.warn('Please run: npm run migrate-templates');
      } else {
        console.error('Error loading templates from database:', dbError);
      }
    }

    // Fall back to code templates
    return NextResponse.json(surveyTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      survey: t.survey,
    })));
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create a new template (admin only)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create templates' }, { status: 403 });
    }

    const { template } = await request.json();

    if (!template || !template.name || !template.survey) {
      return NextResponse.json({ error: 'Template name and survey data are required' }, { status: 400 });
    }

    const pool = getPool();

    try {
      // Generate a unique ID for the template
      const templateId = template.id || `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Check if template ID already exists
      const [existing] = await pool.execute(
        'SELECT id FROM survey_templates WHERE id = ?',
        [templateId]
      ) as any[];

      if (existing.length > 0) {
        return NextResponse.json({ error: 'Template with this ID already exists' }, { status: 409 });
      }

      // Insert new template
      await pool.execute(
        'INSERT INTO survey_templates (id, name, description, icon, survey_data) VALUES (?, ?, ?, ?, ?)',
        [
          templateId,
          template.name,
          template.description || '',
          template.icon || '📋',
          JSON.stringify(template.survey)
        ]
      );

      return NextResponse.json({ 
        message: 'Template created successfully',
        templateId: templateId
      }, { status: 201 });
    } catch (dbError: any) {
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({ 
          error: 'Templates table not found. Please run the migration script: npm run migrate-templates',
          note: 'Run: node scripts/create-templates-table.js'
        }, { status: 500 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update a template (admin only)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update templates' }, { status: 403 });
    }

    const { templateId, template } = await request.json();

    if (!templateId || !template) {
      return NextResponse.json({ error: 'templateId and template are required' }, { status: 400 });
    }

    const pool = getPool();

    try {
      // Check if template exists in database
      const [existing] = await pool.execute(
        'SELECT id FROM survey_templates WHERE id = ?',
        [templateId]
      ) as any[];

      if (existing.length > 0) {
        // Update existing template - include full survey data
        await pool.execute(
          'UPDATE survey_templates SET name = ?, description = ?, icon = ?, survey_data = ?, updated_at = NOW() WHERE id = ?',
          [template.name, template.description, template.icon, JSON.stringify(template.survey), templateId]
        );
      } else {
        // Insert new template (in case it's not migrated yet)
        await pool.execute(
          'INSERT INTO survey_templates (id, name, description, icon, survey_data) VALUES (?, ?, ?, ?, ?)',
          [templateId, template.name, template.description, template.icon, JSON.stringify(template.survey)]
        );
      }

      return NextResponse.json({ 
        message: 'Template updated successfully',
        templateId: templateId
      });
    } catch (dbError: any) {
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({ 
          error: 'Templates table not found. Please run the migration script: npm run migrate-templates',
          note: 'Run: node scripts/create-templates-table.js'
        }, { status: 500 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a template (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete templates' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const pool = getPool();

    try {
      await pool.execute(
        'DELETE FROM survey_templates WHERE id = ?',
        [templateId]
      );

      return NextResponse.json({ 
        message: 'Template deleted successfully'
      });
    } catch (dbError: any) {
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({ 
          error: 'Templates table not found. Please run the migration script: npm run migrate-templates'
        }, { status: 500 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

