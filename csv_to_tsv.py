import pandas as pd
import os
import json

groups = pd.read_csv('academic_groups_2.csv','windows-1252',delimiter=',',engine='python')
print(groups.head())
files = [file for file in os.listdir(".") if '.csv' in file]
#print(files)
for ind,file in enumerate(files):
    if ind==0:
        data = pd.read_csv(file,encoding='windows-1252')
        data.set_index('University',inplace=True)
        #print(data.head())
        filtered = data[[item for item in data.columns.tolist() if item in groups['Name'].tolist()]]
        filtered.fillna(value=999,inplace=True)
        #print(filtered.head())
        field_dict = dict()
        uni_name_list =[]
        uni_ind_list = []
        field_name_list = []
        field_ind_list = []
        for uni_ind,uni in enumerate(filtered.index):
            uni_name_list.append(uni)
            uni_ind_list.append(uni_ind+1)
        for field_ind, field in enumerate(filtered.columns):
            field_name_list.append(field)
            field_ind_list.append(field_ind+1)
            field_dict[field] = int(groups[groups['Name']==field]['Value'].iloc[0])
        print(field_dict)
        headers={"uni_name":uni_name_list,"uni_ind":uni_ind_list,"field_name":field_name_list,"field_ind":field_ind_list,"field_dict":field_dict}
        with open('headers.json','w') as f:
            f.write(json.dumps(headers))
        f.close()
        out_data =pd.DataFrame(columns=['row_idx','col_idx','log2ratio','ranking'])
        for uni_ind,uni in enumerate(filtered.index):
            uni_name_list.append(uni)
            uni_ind_list.append(uni_ind+1)
            for field_ind, field in enumerate(filtered.columns):

                temp = pd.DataFrame(columns=['row_idx','col_idx','log2ratio','ranking'],index=range(0,1))
                temp.loc[0,:] = [uni_ind+1,field_ind+1,filtered.loc[uni,field],filtered.loc[uni,field]]
                out_data =pd.concat([out_data,temp],axis=0,ignore_index=True)
        out_data.to_csv('2016_rankings.tsv',sep='\t',index=None)