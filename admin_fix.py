import os

path = 'src/routes/_authenticated/admin-dashboard.initiatives.$id.manage.tsx'
with open(path, 'r') as f:
    content = f.read()

# Update initial state in useEffect
old_set_form = '''      setFormData({
        title: initiative.title || "",
        caption: initiative.caption || "",
        summary: initiative.summary || "",
        description: initiative.description || "",
        content: initiative.content || "",
        goal_amount_mur: initiative.goal_amount_mur || 0,
        image_url: initiative.image_url || "",
        gallery_urls: initiative.gallery_urls || [],
        is_approved: initiative.is_approved || false,
        is_published: initiative.is_published || false,
      });'''

new_set_form = '''      setFormData({
        title: initiative.title || "",
        caption: initiative.caption || "",
        summary: initiative.summary || "",
        description: initiative.description || "",
        content: initiative.content || "",
        goal_amount_mur: initiative.goal_amount_mur || 0,
        image_url: initiative.image_url || "",
        gallery_urls: initiative.gallery_urls || [],
        is_approved: initiative.is_approved || false,
        is_published: initiative.is_published || false,
        short_term_goals: initiative.short_term_goals || "",
        long_term_goals: initiative.long_term_goals || "",
        target_milestones: initiative.target_milestones || "",
        expected_outcomes: initiative.expected_outcomes || "",
        impact_pool_target: initiative.impact_pool_target || 0,
        impact_pool_current: initiative.impact_pool_current || 0,
      });'''

content = content.replace(old_set_form, new_set_form)

# Add Impact Pool & Goals sections
goals_section = '''
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  Goals & Milestones
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Short-term Goals</label>
                    <textarea
                      name="short_term_goals"
                      value={formData.short_term_goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Long-term Goals</label>
                    <textarea
                      name="long_term_goals"
                      value={formData.long_term_goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Target Milestones</label>
                    <textarea
                      name="target_milestones"
                      value={formData.target_milestones}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Expected Outcomes</label>
                    <textarea
                      name="expected_outcomes"
                      value={formData.expected_outcomes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>'''

impact_pool_section = '''
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Impact Pool</h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Target Amount (MUR)</label>
                    <input
                      name="impact_pool_target"
                      type="number"
                      value={formData.impact_pool_target}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Current Amount (MUR)</label>
                    <input
                      name="impact_pool_current"
                      type="number"
                      value={formData.impact_pool_current}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>'''

# Insert sections
content = content.replace('<div className="space-y-8 lg:col-span-2">', '<div className="space-y-8 lg:col-span-2">' + goals_section)
content = content.replace('<div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">\n                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Goal</h2>', impact_pool_section + '\n              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">\n                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Goal</h2>')

with open(path, 'w') as f:
    f.write(content)
