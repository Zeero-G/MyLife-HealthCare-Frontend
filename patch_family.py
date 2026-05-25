with open('/home/malan/Desktop/ZeeroG/MyLife-Frontend/src/components/FamilyDashboard.tsx', 'r') as f:
    text = f.read()

replacement = """
      {selectedMember ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Records for {members.find(m => m.linked_user_id === selectedMember)?.relationship || 'Member'}</h3>
            <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="p-6">
            {loadingRecords ? (
              <div className="flex justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : memberRecords.length > 0 ? (
              <div className="space-y-4">
                {memberRecords.map(record => (
                  <div key={record.id} className="p-4 border border-gray-100 rounded-lg flex items-start gap-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{record.type}</h4>
                      <p className="text-sm text-gray-500">{record.description}</p>
                      <span className="text-xs text-blue-600 font-medium">Record ID: {record.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No medical records found for this member.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Recent Health Alerts & Updates</h3>
          </div>
          <div className="p-6 text-center text-gray-500 py-12 flex flex-col items-center">
            <Activity size={48} className="text-gray-300 mb-4" />
            <p>No recent alerts for your dependents.</p>
          </div>
        </div>
      )}
    </div>
  );
}"""

# strip existing from <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"> to end
start_idx = text.rfind('<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">')

if start_idx != -1:
    new_text = text[:start_idx] + replacement
    with open('/home/malan/Desktop/ZeeroG/MyLife-Frontend/src/components/FamilyDashboard.tsx', 'w') as f:
        f.write(new_text)
    print("Patched successfully")
else:
    print("Could not find start index")
